import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { Checkbox } from 'react-native-paper';
import 'react-native-gesture-handler';
import { useServices } from '../../app/useServices';
import { palette, spacing, radius, typography } from '../theme';

const ExerciseItem = ({ item, userid, excerciseid, trainingplanid, startedtrainingid, onLogged }) => {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [isInputActive, setIsInputActive] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const services = useServices();
  if (!services) {
    return null;
  }

  const handleSubmit = async () => {
    const payload = {
      workoutId: startedtrainingid,
      exerciseId: excerciseid,
      setNumber: item.setNumber,
      reps: parseInt(reps, 10) || 0,
      weight: weight ? parseFloat(weight) : 0,
      trainingPlanId: trainingplanid,
      userId: userid,
    };
    setSaving(true);
    try {
      await services.workouts.logSet.execute(payload);
      setIsInputActive(false);
      setIsChecked(true);
      setReps('');
      setWeight('');
      setMessage('Set gespeichert. Gute Arbeit!');
      onLogged?.();
    } catch (error) {
      setMessage(error.message || 'Konnte Satz nicht speichern.');
    } finally {
      setSaving(false);
    }
  };

  const toggleInputFields = () => {
    setIsInputActive((prev) => !prev);
    setMessage(null);
  };

  return (
    <View style={styles.exerciseItem}>
      <View style={styles.row}>
        <TouchableOpacity onPress={toggleInputFields} style={styles.exerciseButton}>
          <Text style={styles.exerciseName}>
            {item.name} (Set {item.setNumber})
          </Text>
          <Text style={styles.exerciseSub}>Tippen, um Werte einzutragen</Text>
        </TouchableOpacity>
        <Checkbox status={isChecked ? 'checked' : 'unchecked'} onPress={() => setIsChecked(!isChecked)} disabled color={palette.primary} />
      </View>

      {isInputActive && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Gewicht"
            keyboardType="numeric"
            value={weight}
            onChangeText={setWeight}
            placeholderTextColor="#9ca3af"
          />
          <TextInput
            style={styles.input}
            placeholder="Wiederholungen"
            keyboardType="numeric"
            value={reps}
            onChangeText={setReps}
            placeholderTextColor="#9ca3af"
          />
          <Button title={saving ? 'Speichern...' : 'Satz speichern'} onPress={handleSubmit} color={palette.primary} disabled={saving} />
        </>
      )}
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  exerciseItem: {
    padding: spacing.md,
    marginVertical: 8,
    backgroundColor: '#F9F9F9',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseButton: {
    flex: 1,
    padding: 10,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.primary,
  },
  exerciseSub: {
    ...typography.muted,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    padding: 12,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
  message: {
    marginTop: spacing.xs,
    color: palette.success,
  },
});

export default ExerciseItem;
