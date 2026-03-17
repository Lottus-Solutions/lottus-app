import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { LayoutDashboard, Trophy, History, Sparkle, Book } from 'lucide-react-native';

const TABS = [
  { label: 'Visão geral', Icon: LayoutDashboard, route: '/visao-geral' },
  { label: 'Leituras', Icon: Book, route: '/leituras' },
  { label: 'Assistente', Icon: Sparkle, route: '/assistente', isFab: true },
  { label: 'Metas', Icon: Trophy, route: '/metas' },
  { label: 'Histórico', Icon: History, route: '/historico' },
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
          pathname.startsWith(route + '/');

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
    paddingBottom: 32,
    paddingHorizontal: 12,
    fontFamily: 'KoHo_400Regular',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },
  tabLabel: { fontFamily: 'KoHo_400Regular', fontSize: 10, color: '#999999', marginTop: 2 },
  tabLabelActive: { fontFamily: 'KoHo_600SemiBold', color: '#0292B7' },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0292B7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0292B7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 20,
    position: 'relative',
    bottom: 28,
  },
});