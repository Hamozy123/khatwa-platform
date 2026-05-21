import 'package:flutter/material.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/students_screen.dart';
import 'screens/student_profile_screen.dart';
import 'services/api_service.dart';

void main() {
  runApp(const KhatwaApp());
}

class KhatwaApp extends StatelessWidget {
  const KhatwaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'خطوة',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1E6BB8),
          brightness: Brightness.light,
        ),
        useMaterial3: true,
        fontFamily: 'Cairo',
      ),
      routes: {
        '/': (context) => const LoginScreen(),
        '/dashboard': (context) => const DashboardScreen(),
        '/students': (context) => const StudentsScreen(),
      },
      onGenerateRoute: (settings) {
        if (settings.name?.startsWith('/student/') == true) {
          final id = int.tryParse(settings.name!.split('/').last) ?? 0;
          return MaterialPageRoute(
            builder: (_) => StudentProfileScreen(studentId: id),
          );
        }
        return null;
      },
    );
  }
}
