import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../widgets/app_drawer.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic>? _summary;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await ApiService.get('/reports/summary');
      setState(() { _summary = data; _loading = false; });
    } catch (e) {
      setState(() { _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('لوحة التحكم'), actions: [
        IconButton(icon: const Icon(Icons.notifications_outlined), onPressed: () {}),
      ]),
      drawer: const AppDrawer(),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _StatCard(title: 'الطلاب', value: '${_summary?['students'] ?? 0}', icon: Icons.people),
                  const SizedBox(height: 12),
                  _StatCard(title: 'خطط IEP النشطة', value: '${_summary?['activeIepPlans'] ?? 0}', icon: Icons.assignment),
                  const SizedBox(height: 12),
                  _StatCard(title: 'نسبة الإنجاز', value: '${_summary?['weeklyAchievementPercent'] ?? 0}%', icon: Icons.trending_up),
                  const SizedBox(height: 12),
                  _StatCard(title: 'الأهداف المكتملة', value: '${_summary?['objectivesCompleted'] ?? 0} / ${_summary?['goalsTotal'] ?? 0}', icon: Icons.check_circle),
                ],
              ),
            ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;

  const _StatCard({required this.title, required this.value, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: Icon(icon, color: Theme.of(context).colorScheme.primary),
        title: Text(title),
        trailing: Text(value, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
      ),
    );
  }
}
