if(typeof window.preFS == 'undefined') window.preFS={};
window.preFS['multigame/driver/library.js']='Ly8gTGlicmFyeSBmdW5jdGlvbnMgZm9yIHdlYi1kcml2ZXIKCgpmdW5jdGlvbiBjaGVja0ZvckV4dGVuc2lvbkVycm9yKGVyckNhbGxiYWNrKSB7CiAgaWYgKHR5cGVvZihjaHJvbWUuZXh0ZW5zaW9uLmxhc3RFcnJvcikgIT0gJ3VuZGVmaW5lZCcpIHsKICAgICAgdmFyIGVycm9yID0gbmV3IEVycm9yKGNocm9tZS5leHRlbnNpb24ubGFzdEVycm9yLm1lc3NhZ2UpOwogICAgICBlcnJDYWxsYmFjayhlcnJvcik7CiAgICAgIHRocm93IGVycm9yOwogIH0KfQoKLyoqCiogQ2FwdHVyZXMgYSBzY3JlZW5zaG90IG9mIHRoZSB2aXNpYmxlIHRhYi4KKgoqIEBwYXJhbSB7ZnVuY3Rpb24oc3RyaW5nKX0gY2FsbGJhY2sgVGhlIGNhbGxiYWNrIHRvIGludm9rZSB3aXRoIHRoZSBiYXNlNjQKKiAgICAgZW5jb2RlZCBQTkcuCiogQHBhcmFtIHtmdW5jdGlvbighRXJyb3IpfSBlcnJDYWxsYmFjayBUaGUgY2FsbGJhY2sgdG8gaW52b2tlIGZvciBlcnJvcgoqICAgICByZXBvcnRpbmcuCiovCmZ1bmN0aW9uIGNhcHR1cmVTY3JlZW5zaG90KGNhbGxiYWNrLCBlcnJDYWxsYmFjaykgewogIGNocm9tZS50YWJzLmNhcHR1cmVWaXNpYmxlVGFiKHtmb3JtYXQ6ICdwbmcnfSwgZnVuY3Rpb24gKGRhdGFVcmwpIHsKICAgICAgaWYgKGNocm9tZS5leHRlbnNpb24ubGFzdEVycm9yICYmCiAgICAgICAgICBjaHJvbWUuZXh0ZW5zaW9uLmxhc3RFcnJvci5tZXNzYWdlLmluZGV4T2YoJ3Blcm1pc3Npb24nKSAhPSAtMSkgewogICAgICAgICAgdmFyIGVycm9yID0gbmV3IEVycm9yKGNocm9tZS5leHRlbnNpb24ubGFzdEVycm9yLm1lc3NhZ2UpOwogICAgICAgICAgZXJyb3IuY29kZSA9IDEwMzsgIC8vIGtGb3JiaWRkZW4KICAgICAgICAgIGVyckNhbGxiYWNrKGVycm9yKTsKICAgICAgICAgIHJldHVybjsKICAgICAgfQogICAgICBjaGVja0ZvckV4dGVuc2lvbkVycm9yKGVyckNhbGxiYWNrKTsKICAgICAgdmFyIGJhc2U2NCA9ICc7YmFzZTY0LCc7CiAgICAgIGNhbGxiYWNrKGRhdGFVcmwuc3Vic3RyKGRhdGFVcmwuaW5kZXhPZihiYXNlNjQpICsgYmFzZTY0Lmxlbmd0aCkpCiAgfSk7Cn0KCi8qKgoqIEdldHMgaW5mbyBhYm91dCB0aGUgY3VycmVudCB3aW5kb3cuCioKKiBAcGFyYW0ge2Z1bmN0aW9uKCopfSBjYWxsYmFjayBUaGUgY2FsbGJhY2sgdG8gaW52b2tlIHdpdGggdGhlIHdpbmRvdyBpbmZvLgoqIEBwYXJhbSB7ZnVuY3Rpb24oIUVycm9yKX0gZXJyQ2FsbGJhY2sgVGhlIGNhbGxiYWNrIHRvIGludm9rZSBmb3IgZXJyb3IKKiAgICAgcmVwb3J0aW5nLgoqLwpmdW5jdGlvbiBnZXRXaW5kb3dJbmZvKGNhbGxiYWNrLCBlcnJDYWxsYmFjaykgewogIGNocm9tZS53aW5kb3dzLmdldEN1cnJlbnQoe3BvcHVsYXRlOiB0cnVlfSwgZnVuY3Rpb24gKHdpbmRvdykgewogICAgICBjaGVja0ZvckV4dGVuc2lvbkVycm9yKGVyckNhbGxiYWNrKTsKICAgICAgY2FsbGJhY2sod2luZG93KTsKICB9KTsKfQoKLyoqCiogVXBkYXRlcyB0aGUgcHJvcGVydGllcyBvZiB0aGUgY3VycmVudCB3aW5kb3cuCioKKiBAcGFyYW0ge09iamVjdH0gdXBkYXRlSW5mbyBVcGRhdGUgaW5mbyB0byBwYXNzIHRvIGNocm9tZS53aW5kb3dzLnVwZGF0ZS4KKiBAcGFyYW0ge2Z1bmN0aW9uKCl9IGNhbGxiYWNrIEludm9rZWQgd2hlbiB0aGUgdXBkYXRpbmcgaXMgY29tcGxldGUuCiogQHBhcmFtIHtmdW5jdGlvbighRXJyb3IpfSBlcnJDYWxsYmFjayBUaGUgY2FsbGJhY2sgdG8gaW52b2tlIGZvciBlcnJvcgoqICAgICByZXBvcnRpbmcuCiovCmZ1bmN0aW9uIHVwZGF0ZVdpbmRvdyh1cGRhdGVJbmZvLCBjYWxsYmFjaywgZXJyQ2FsbGJhY2spIHsKICBjb25zb2xlLmxvZyhhcmd1bWVudHMpOwogIGNocm9tZS53aW5kb3dzLmdldEN1cnJlbnQoe30sIGZ1bmN0aW9uICh3aW5kb3cpIHsKICAgICAgY2hlY2tGb3JFeHRlbnNpb25FcnJvcihlcnJDYWxsYmFjayk7CiAgICAgIGNocm9tZS53aW5kb3dzLnVwZGF0ZShzZWxmLmlkLCB1cGRhdGVJbmZvLCBmdW5jdGlvbiAod2luZG93KSB7CiAgICAgICAgICBjaGVja0ZvckV4dGVuc2lvbkVycm9yKGVyckNhbGxiYWNrKTsKICAgICAgICAgIGNhbGxiYWNrKCk7CiAgICAgIH0pOwogIH0pOwp9CgovKioKKiBMYXVuY2hlcyBhbiBhcHAgd2l0aCB0aGUgc3BlY2lmaWVkIGlkLgoqCiogQHBhcmFtIHtzdHJpbmd9IGlkIFRoZSBJRCBvZiB0aGUgYXBwIHRvIGxhdW5jaC4KKiBAcGFyYW0ge2Z1bmN0aW9uKCl9IGNhbGxiYWNrIEludm9rZWQgd2hlbiB0aGUgbGF1bmNoIGV2ZW50IGlzIGNvbXBsZXRlLgoqIEBwYXJhbSB7ZnVuY3Rpb24oIUVycm9yKX0gZXJyQ2FsbGJhY2sgVGhlIGNhbGxiYWNrIHRvIGludm9rZSBmb3IgZXJyb3IKKiAgICAgcmVwb3J0aW5nLgoqLwpmdW5jdGlvbiBsYXVuY2hBcHAoaWQsIGNhbGxiYWNrLCBlcnJDYWxsYmFjaykgewogIGNocm9tZS5tYW5hZ2VtZW50LmxhdW5jaEFwcChpZCwgZnVuY3Rpb24gKCkgewogICAgICBjaGVja0ZvckV4dGVuc2lvbkVycm9yKGVyckNhbGxiYWNrKTsKICAgICAgY2FsbGJhY2soKTsKICB9KTsKfQoKCgphc3luYyBmdW5jdGlvbiBuZXdXaW5kb3coKSB7CiAgbGV0IHdpbiA9IGF3YWl0IGNocm9tZS53aW5kb3dzLmNyZWF0ZSgpCiAgcmV0dXJuIHdpbgp9Cgphc3luYyBmdW5jdGlvbiBkb2N1bWVudFRpdGxlKHRhYklkKSB7CiAgbGV0IHRhYiA9IGF3YWl0IGNocm9tZS50YWJzLmdldCh0YWJJZCkKICByZXR1cm4gdGFiLnRpdGxlCn0KCmFzeW5jIGZ1bmN0aW9uIHNsZWVwKHNlY3MpIHsKICByZXR1cm4gYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIHNlY3MgKiAxMDAwKSkKfQoKbW9kdWxlLmV4cG9ydHMgPSB7CiAgZG9jdW1lbnRUaXRsZSwKICBuZXdXaW5kb3csCiAgc2xlZXAsCn0KCg==';
