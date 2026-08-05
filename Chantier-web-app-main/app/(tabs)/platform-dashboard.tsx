import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import {
  LayoutDashboard,
  Building2,
  Shield,
  Plus,
} from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { Colors } from '@/constants/colors';
import { PlatformDashboardSection } from '@/components/platform/PlatformDashboardSection';
import {
  PlatformCompaniesSection,
  PlatformCompaniesSectionHandle,
} from '@/components/platform/PlatformCompaniesSection';
import {
  PlatformCompanyAdminsSection,
  PlatformCompanyAdminsSectionHandle,
  AdminSubTab,
} from '@/components/platform/PlatformCompanyAdminsSection';
import { parsePlatformSegment, PlatformSegment } from '@/components/platform/types';

const adminHeaderBackground = require('../../assets/images/bg (2).png');

export default function PlatformHubScreen() {
  const { t } = useLanguage();
  const ph = t.platform.hub;
  const router = useRouter();
  const params = useLocalSearchParams<{ segment?: string }>();
  const { headerPaddingTop } = useTabBarInset();
  const companiesRef = useRef<PlatformCompaniesSectionHandle>(null);
  const adminsRef = useRef<PlatformCompanyAdminsSectionHandle>(null);

  const [activeSegment, setActiveSegment] = useState<PlatformSegment>(() =>
    parsePlatformSegment(params.segment),
  );
  const [adminsSubTab, setAdminsSubTab] = useState<AdminSubTab>('admins');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next = parsePlatformSegment(params.segment);
    setActiveSegment(next);
  }, [params.segment]);

  const switchSegment = useCallback(
    (segment: PlatformSegment) => {
      setActiveSegment(segment);
      setError(null);
      router.setParams({ segment: segment === 'dashboard' ? undefined : segment });
    },
    [router],
  );

  const onHeaderAdd = () => {
    if (activeSegment === 'companies') companiesRef.current?.openCreate();
    if (activeSegment === 'admins') adminsRef.current?.openCreate();
  };

  const showAddButton =
    activeSegment === 'companies' ||
    (activeSegment === 'admins' && adminsSubTab === 'admins');

  const segments: { key: PlatformSegment; label: string; icon: React.ReactNode }[] = [
    {
      key: 'dashboard',
      label: ph.segments.dashboard,
      icon: <LayoutDashboard size={16} color={activeSegment === 'dashboard' ? Colors.primary : 'rgba(255,255,255,0.85)'} />,
    },
    {
      key: 'companies',
      label: ph.segments.companies,
      icon: <Building2 size={16} color={activeSegment === 'companies' ? Colors.primary : 'rgba(255,255,255,0.85)'} />,
    },
    {
      key: 'admins',
      label: ph.segments.admins,
      icon: <Shield size={16} color={activeSegment === 'admins' ? Colors.primary : 'rgba(255,255,255,0.85)'} />,
    },
  ];

  return (
    <View style={styles.container}>
      <ImageBackground
        source={adminHeaderBackground}
        resizeMode="cover"
        style={styles.header}
        imageStyle={styles.headerImage}
      >
        <View style={[styles.headerOverlay, { paddingTop: headerPaddingTop }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle}>{ph.title}</Text>
              <Text style={styles.headerSubtitle}>{ph.subtitle}</Text>
            </View>
            {showAddButton ? (
              <TouchableOpacity
                style={styles.headerAddBtn}
                onPress={onHeaderAdd}
                accessibilityRole="button"
                accessibilityLabel={
                  activeSegment === 'companies'
                    ? t.platform.companies.createModal.createButton
                    : t.platform.admins.createButton
                }
              >
                <Plus size={20} color="#FFF" strokeWidth={2.5} />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.tabBar}>
            {segments.map(({ key, label, icon }) => (
              <TouchableOpacity
                key={key}
                style={[styles.tab, activeSegment === key && styles.tabActive]}
                onPress={() => switchSegment(key)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected: activeSegment === key }}
              >
                {icon}
                <Text style={[styles.tabText, activeSegment === key && styles.tabTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ImageBackground>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.sectionBody}>
        {activeSegment === 'dashboard' ? (
          <PlatformDashboardSection onError={setError} />
        ) : null}
        {activeSegment === 'companies' ? (
          <PlatformCompaniesSection ref={companiesRef} onError={setError} />
        ) : null}
        {activeSegment === 'admins' ? (
          <PlatformCompanyAdminsSection
            ref={adminsRef}
            onError={setError}
            onSubTabChange={setAdminsSubTab}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF7F2',
  },
  sectionBody: {
    flex: 1,
  },
  header: {
    overflow: 'hidden',
  },
  headerImage: {
    opacity: 0.95,
  },
  headerOverlay: {
    paddingBottom: 0,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 107, 53, 0.58)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  headerAddBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,107,53,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 0,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  tabActive: {
    backgroundColor: '#FFF7F2',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
  },
  tabTextActive: {
    color: Colors.text.primary,
  },
  errorBanner: {
    backgroundColor: Colors.error + '10',
    borderBottomWidth: 1,
    borderBottomColor: Colors.error + '30',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
  },
});
