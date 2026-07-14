import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'expo-router';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { Building2, Calendar, MapPin, CircleCheck as CheckCircle2 } from 'lucide-react-native';

export default function SelectWorksiteScreen() {
  const { assignedWorksites, selectedWorksite, setSelectedWorksite } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const { headerPaddingTop } = useTabBarInset();

  const handleSelectWorksite = (worksite: any) => {
    setSelectedWorksite(worksite);
    router.navigate('/(tabs)/ouvrier-dashboard');
  };

  if (assignedWorksites.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Building2 size={64} color="#CCC" />
          <Text style={styles.emptyTitle}>{t.selectWorksite.noWorksite}</Text>
          <Text style={styles.emptyMessage}>{t.selectWorksite.contactManager}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
        <Text style={styles.title}>{t.selectWorksite.title}</Text>
        <Text style={styles.subtitle}>{t.selectWorksite.subtitle}</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {assignedWorksites.map((affectation) => {
          const chantier = affectation.chantiers;
          if (!chantier) return null;

          const isSelected = selectedWorksite?.id === affectation.id;

          return (
            <TouchableOpacity
              key={affectation.id}
              style={[styles.worksiteCard, isSelected && styles.worksiteCardSelected]}
              onPress={() => handleSelectWorksite(affectation)}>
              <View style={styles.worksiteHeader}>
                <View style={styles.worksiteIcon}>
                  <Building2 size={24} color={isSelected ? '#4CAF50' : '#666'} />
                </View>
                <View style={styles.worksiteInfo}>
                  <Text style={styles.worksiteName}>{chantier.nom}</Text>
                  <Text style={styles.worksiteCode}>{chantier.code}</Text>
                </View>
                {isSelected && <CheckCircle2 size={24} color="#4CAF50" />}
              </View>

              <View style={styles.worksiteDetails}>
                <View style={styles.detailRow}>
                  <MapPin size={16} color="#666" />
                  <Text style={styles.detailText}>{chantier.adresse}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Calendar size={16} color="#666" />
                  <Text style={styles.detailText}>
                    Du {new Date(affectation.date_debut).toLocaleDateString('fr-FR')}
                    {affectation.date_fin
                      ? ` au ${new Date(affectation.date_fin).toLocaleDateString('fr-FR')}`
                      : ` ${t.selectWorksite.ongoing}`}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  worksiteCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginBottom: 16,
  },
  worksiteCardSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8F4',
  },
  worksiteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  worksiteIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  worksiteInfo: {
    flex: 1,
  },
  worksiteName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  worksiteCode: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  worksiteDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 24,
    marginBottom: 12,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});
