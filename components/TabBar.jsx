import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { LayoutDashboard, BookOpen, Trophy, History, Sparkle } from 'lucide-react-native';

const TABS = [
  { label: 'Visão geral', Icon: LayoutDashboard, route: '/' },
  { label: 'Leituras',    Icon: BookOpen,         route: '/leituras' },
  { label: 'Assistente',            Icon: Sparkle,             route: '/assistente', isFab: true },
  { label: 'Metas',       Icon: Trophy,           route: '/metas' },
  { label: 'Histórico',   Icon: History,          route: '/historico' },
];

export default function TabBar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const { label, Icon, route, isFab } = tab;

        if (isFab) {
          return (
            <TouchableOpacity
              key={route}
              onPress={() => router.push(route)}
              style={styles.fab}
              activeOpacity={0.85}
            >
              <Icon size={28} color="#FFFFFF" />
            </TouchableOpacity>
          );
        }

        const isActive =
          pathname === route ||
          (route !== '/' && pathname.startsWith(route));

        return (
          <TouchableOpacity
            key={route}
            onPress={() => router.push(route)}
            style={styles.tab}
            activeOpacity={0.7}
          >
            <Icon size={22} color={isActive ? '#0292B7' : '#999999'} />
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {label}
            </Text>
            {isActive && <View style={styles.activeDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0DDD6',
    paddingBottom: 28,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 10,
    color: '#999999',
    marginTop: 2,
  },
  tabLabelActive: {
    fontWeight: '600',
    color: '#0292B7',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0292B7',
    marginTop: 2,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0292B7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    shadowColor: '#0292B7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
});