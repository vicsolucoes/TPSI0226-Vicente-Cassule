#!/usr/bin/env python3
"""Remove credentials from a local Mendix MPRv2 before versioning.

Preserves every other BSON element byte-for-byte and updates the MPRv2 SHA256
index. Test accounts are added separately to a disposable runtime copy.
"""
import argparse
import base64
import hashlib
from pathlib import Path
import sqlite3
import secrets
import struct
import uuid


def entries(data, offset=0):
    size = struct.unpack_from('<i', data, offset)[0]
    if size < 5 or offset + size > len(data):
        raise ValueError('Invalid BSON length')
    pos = offset + 4
    result = []
    while pos < offset + size - 1:
        begin = pos
        kind = data[pos]
        pos += 1
        end = data.index(0, pos)
        key = data[pos:end].decode('utf-8')
        pos = end + 1
        value_start = pos
        value = None
        if kind in (3, 4):
            value, length = entries(data, pos)
            pos += length
        elif kind in (2, 13, 14):
            length = struct.unpack_from('<i', data, pos)[0]
            value = data[pos + 4:pos + 3 + length].decode('utf-8')
            pos += 4 + length
        elif kind == 5:
            length = struct.unpack_from('<i', data, pos)[0]
            pos += 5 + length
        elif kind == 8:
            value = bool(data[pos])
            pos += 1
        elif kind == 16:
            value = struct.unpack_from('<i', data, pos)[0]
            pos += 4
        elif kind == 18:
            value = struct.unpack_from('<q', data, pos)[0]
            pos += 8
        elif kind in (1, 9, 17):
            pos += 8
        elif kind in (10, 127, 255):
            pass
        elif kind == 7:
            pos += 12
        else:
            raise ValueError(f'Unsupported BSON type {kind} at {key}')
        result.append(dict(key=key, kind=kind, value=value, begin=begin,
                           end=pos, value_start=value_start))
    if pos != offset + size - 1 or data[pos] != 0:
        raise ValueError('Invalid BSON terminator')
    return result, size


def strip_credentials(data, prepared_password=None):
    fields, size = entries(data)
    if size != len(data):
        raise ValueError('Trailing BSON bytes')
    by_key = {x['key']: x for x in fields}
    if by_key.get('$Type', {}).get('value') != 'Security$ProjectSecurity':
        return data, 0
    parts = []
    removed = 0
    for field in fields:
        key = field['key']
        prefix = data[field['begin']:field['value_start']]
        if key == 'DemoUsers':
            array = field['value']
            # Mendix typed-array marker 2 is kept; account definitions are removed.
            if field['kind'] != 4 or not array or array[0]['value'] != 2:
                raise ValueError('Unexpected DemoUsers representation')
            marker = data[array[0]['begin']:array[0]['end']]
            replacement = struct.pack('<i', 5 + len(marker)) + marker + b'\0'
            parts.append(prefix + replacement)
            removed += len(array) - 1
        elif key == 'AdminPassword':
            if field['kind'] != 2:
                raise ValueError('Unexpected AdminPassword representation')
            password = (prepared_password or '').encode('utf-8')
            parts.append(prefix + struct.pack('<i', len(password) + 1) + password + b'\0')
            removed += int(bool(field['value']))
        else:
            parts.append(data[field['begin']:field['end']])
    body = b''.join(parts) + b'\0'
    cleaned = struct.pack('<i', len(body) + 4) + body
    checked, _ = entries(cleaned)
    after = {x['key']: x for x in checked}
    if after['AdminPassword']['value'] != (prepared_password or '') or len(after['DemoUsers']['value']) != 1:
        raise ValueError('Credential removal failed')
    if after['EnableDemoUsers']['value'] or after['EnableGuestAccess']['value']:
        raise ValueError('Delivered project must not allow demo or anonymous access')
    for field in fields:
        if field['key'] in ('DemoUsers', 'AdminPassword'):
            continue
        replacement = after[field['key']]
        if data[field['begin']:field['end']] != cleaned[replacement['begin']:replacement['end']]:
            raise ValueError('Unrelated model element changed')
    return cleaned, removed


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('project', type=Path)
    parser.add_argument('--prepare-runtime', action='store_true', help='Ephemeral credential for local validation; never export this copy')
    args = parser.parse_args()
    project = args.project.resolve()
    runtime_password = secrets.token_urlsafe(24) + 'Aa9!' if args.prepare_runtime else None
    contents = project.parent / 'mprcontents'
    if not contents.is_dir():
        raise SystemExit('Expected an MPRv2 project with mprcontents')
    found = False
    for unit in contents.rglob('*.mxunit'):
        data = unit.read_bytes()
        if b'Security$ProjectSecurity' not in data:
            continue
        cleaned, removed = strip_credentials(data, runtime_password)
        if cleaned == data and not removed:
            found = True
            continue
        old_hash = base64.b64encode(hashlib.sha256(data).digest()).decode('ascii')
        new_hash = base64.b64encode(hashlib.sha256(cleaned).digest()).decode('ascii')
        identifier = uuid.UUID(unit.stem).bytes_le
        with sqlite3.connect(project) as connection:
            row = connection.execute('SELECT ContentsHash FROM Unit WHERE UnitID=?', (identifier,)).fetchone()
            if not row or row[0] != old_hash:
                raise ValueError('Original unit checksum does not match MPR index')
            unit.write_bytes(cleaned)
            connection.execute('UPDATE Unit SET ContentsHash=? WHERE UnitID=?', (new_hash, identifier))
            connection.execute('UPDATE _Transaction SET LastTransactionID=?', (str(uuid.uuid4()),))
            if connection.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
                raise ValueError('MPR integrity check failed')
        print(f'Removed {removed} template credential definitions; other security settings preserved.')
        found = True
    if not found:
        raise SystemExit('ProjectSecurity unit not found')
    if args.prepare_runtime:
        print('Prepared an ephemeral administrator credential for isolated checks; no demo definitions.')
    else:
        print('Verified: no administrator password or demo account definitions in delivered model.')


if __name__ == '__main__':
    main()
