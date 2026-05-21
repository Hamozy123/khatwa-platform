import 'package:flutter/material.dart';
import '../services/api_service.dart';

class StudentProfileScreen extends StatefulWidget {
  final int studentId;
  const StudentProfileScreen({super.key, required this.studentId});

  @override
  State<StudentProfileScreen> createState() => _StudentProfileScreenState();
}

class _StudentProfileScreenState extends State<StudentProfileScreen> {
  Map<String, dynamic>? _student;
  List<dynamic> _plans = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final results = await Future.wait([
        ApiService.get('/students/${widget.studentId}'),
        ApiService.get('/iep/plans/student/${widget.studentId}'),
      ]);
      setState(() {
        _student = results[0] as Map<String, dynamic>;
        _plans = results[1] as List<dynamic>;
        _loading = false;
      });
    } catch (e) {
      setState(() { _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_student?['fullName'] as String? ?? 'ملف الطالب')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('الاسم: ${_student?['fullName'] ?? ''}', style: const TextStyle(fontSize: 16)),
                      const SizedBox(height: 8),
                      Text('نوع الإعاقة: ${_student?['disabilityType'] ?? '—'}', style: const TextStyle(color: Colors.grey)),
                      Text('التشخيص: ${_student?['diagnosis'] ?? '—'}', style: const TextStyle(color: Colors.grey)),
                    ]),
                  ),
                ),
                const SizedBox(height: 16),
                Text('خطط IEP', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                if (_plans.isEmpty)
                  const Card(child: Padding(padding: EdgeInsets.all(16), child: Text('لا توجد خطط IEP', style: TextStyle(color: Colors.grey))))
                else
                  ...(_plans.map((p) {
                    final plan = p as Map<String, dynamic>;
                    final goals = plan['goals'] as List<dynamic>? ?? [];
                    return Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text('خطة #${plan['id']}', style: const TextStyle(fontWeight: FontWeight.bold)),
                          ...goals.map((g) {
                            final goal = g as Map<String, dynamic>;
                            return Padding(
                              padding: const EdgeInsets.only(top: 8),
                              child: Row(children: [
                                Expanded(child: Text(goal['title'] as String)),
                                Text('${goal['currentPercentage'] ?? 0}%', style: const TextStyle(fontWeight: FontWeight.bold)),
                              ]),
                            );
                          }),
                        ]),
                      ),
                    );
                  })),
              ],
            ),
    );
  }
}
