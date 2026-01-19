import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, TextInput, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getOrCreateLocalUser, getUserById, updateUserCredentialsForSync, clearCurrentUser } from '../../repositories/usersRepository';
import { palette, spacing, radius, typography } from '../theme';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState({ name: '', mail: '', password: '' });

  const loadProfile = async () => {
    const userId = await getOrCreateLocalUser();
    const user = await getUserById(userId);
    if (user) {
      setProfile({ name: user.name || '', mail: user.mail || '', password: '' });
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, []),
  );

  const handleSaveProfile = async () => {
    try {
      const userId = await getOrCreateLocalUser();
      await updateUserCredentialsForSync({
        userId,
        name: profile.name,
        mail: profile.mail,
        password: profile.password,
      });
      setError(null);
      setProfile((prev) => ({ ...prev, password: '' }));
    } catch (err) {
      setError(err.message || 'Speichern fehlgeschlagen');
    }
  };

  const handleLogout = async () => {
    await clearCurrentUser();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={styles.title}>Einstellungen</Text>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Profil</Text>
        <Text style={styles.helper}>Dein Profil wird nur lokal gespeichert.</Text>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={profile.name}
          onChangeText={(value) => setProfile((prev) => ({ ...prev, name: value }))}
        />
        <TextInput
          style={styles.input}
          placeholder="E-Mail"
          value={profile.mail}
          onChangeText={(value) => setProfile((prev) => ({ ...prev, mail: value }))}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Passwort"
          value={profile.password}
          onChangeText={(value) => setProfile((prev) => ({ ...prev, password: value }))}
          secureTextEntry
        />
        <TouchableOpacity style={styles.secondaryButton} onPress={handleSaveProfile}>
          <Text style={styles.secondaryButtonText}>Profil lokal speichern</Text>
        </TouchableOpacity>
        {error && <Text style={styles.error}>{error}</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Sync</Text>
        <Text style={styles.helper}>Diese App l&auml;uft komplett offline. Online-Sync wurde entfernt.</Text>
        <TouchableOpacity style={styles.button} onPress={handleLogout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: '#f4f6fb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  offline: {
    color: '#d35400',
    marginBottom: 8,
  },
  error: {
    color: 'red',
    marginTop: 8,
  },
  helper: {
    color: '#4a4a4a',
    marginBottom: 10,
  },
  button: {
    marginTop: 12,
    backgroundColor: '#1E90FF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    marginTop: 8,
    backgroundColor: '#f0f4ff',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#1E90FF',
    fontWeight: '600',
  },
  summary: {
    marginTop: 10,
    gap: 4,
  },
  input: {
    height: 48,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
});

export default SettingsScreen;
