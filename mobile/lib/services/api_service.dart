import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  static const _baseUrl = 'http://10.0.2.2:3001/api';
  static const _storage = FlutterSecureStorage();
  static const _tokenKey = 'khatwa_token';

  static Future<String?> getToken() => _storage.read(key: _tokenKey);
  static Future<void> setToken(String token) => _storage.write(key: _tokenKey, value: token);
  static Future<void> clearToken() => _storage.delete(key: _tokenKey);

  static Future<Map<String, String>> _headers() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<dynamic> get(String path) async {
    final res = await http.get(Uri.parse('$_baseUrl$path'), headers: await _headers());
    _checkAuth(res);
    return jsonDecode(res.body);
  }

  static Future<dynamic> post(String path, Map<String, dynamic> body) async {
    final res = await http.post(Uri.parse('$_baseUrl$path'), headers: await _headers(), body: jsonEncode(body));
    _checkAuth(res);
    return jsonDecode(res.body);
  }

  static Future<dynamic> put(String path, Map<String, dynamic> body) async {
    final res = await http.put(Uri.parse('$_baseUrl$path'), headers: await _headers(), body: jsonEncode(body));
    _checkAuth(res);
    return jsonDecode(res.body);
  }

  static Future<dynamic> delete(String path) async {
    final res = await http.delete(Uri.parse('$_baseUrl$path'), headers: await _headers());
    _checkAuth(res);
    if (res.statusCode == 204) return null;
    return jsonDecode(res.body);
  }

  static void _checkAuth(http.Response res) {
    if (res.statusCode == 401) {
      clearToken();
      throw Exception('Unauthorized');
    }
  }
}
