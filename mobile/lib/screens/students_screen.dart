import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../widgets/app_drawer.dart';

class StudentsScreen extends StatefulWidget {
  const StudentsScreen({super.key});

  @override
  State<StudentsScreen> createState() => _StudentsScreenState();
}

class _StudentsScreenState extends State<StudentsScreen> {
  List<dynamic> _students = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await ApiService.get('/students');
      setState(() { _students = data as List<dynamic>; _loading = false; });
    } catch (e) {
      setState(() { _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('سجل الطلاب')),
      drawer: const AppDrawer(),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView.builder(
                padding: const EdgeInsets.all(8),
                itemCount: _students.length,
                itemBuilder: (context, index) {
                  final s = _students[index] as Map<String, dynamic>;
                  return Card(
                    child: ListTile(
                      title: Text(s['fullName'] as String),
                      subtitle: Text(s['disabilityType'] as String? ?? ''),
                      trailing: const Icon(Icons.chevron_left),
                      onTap: () => Navigator.pushNamed(context, '/student/${s['id']}'),
                    ),
                  );
                },
              ),
            ),
    );
  }
}
