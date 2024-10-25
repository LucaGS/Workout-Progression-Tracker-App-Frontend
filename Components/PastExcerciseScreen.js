import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { NgrokBackendUrlTunnel } from '../constants'; 

const PastExcercisesScreen = ({ route }) => {
  const { userId, excerciseid, excercisename } = route.params;
  const [pastExercises, setPastExercises] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);

  useEffect(() => {
    const fetchPastExercises = async () => {
      try {
        const response = await fetch(
          `${NgrokBackendUrlTunnel}/api/PastExcercise/ExcercisesAvg/${userId}/${excerciseid}`
        );
        if (response.ok) {
          const data = await response.json();
          setPastExercises(data);
        } else {
          console.error("Failed to fetch past exercises");
        }
      } catch (error) {
        console.error("Error fetching past exercises:", error);
      }
    };

    fetchPastExercises();
  }, [userId, excerciseid]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={styles.tableHeaderText}>Date</Text>
      <Text style={styles.tableHeaderText}>Average</Text>
    </View>
  );

  const toggleSets = (index) => {
    setSelectedIndex(selectedIndex === index ? null : index);
  };

  const renderSets = (sets) => (
    <View style={styles.setsContainer}>
      {sets.map((set, idx) => (
        <View key={idx} style={styles.setRow}>
          <Text style={styles.setText}>{set.set}.</Text> 
          <View style={styles.setDetails}> 
            <Text style={styles.setWeight}>{set.reps} x {set.weight} kg </Text>
            
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Welcome {excercisename}</Text>
      {renderTableHeader()}
      <FlatList
        data={pastExercises}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View>
            <TouchableOpacity
              onPress={() => toggleSets(index)}
              style={[
                styles.tableRow,
                selectedIndex === index && styles.selectedRow 
              ]}
            >
              <Text style={styles.tableCell}>{formatDate(item.date)}</Text>
              <Text style={styles.tableCell}>{item.avg}</Text>
            </TouchableOpacity>
            {selectedIndex === index && renderSets(item.sets)}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#e8f0fe", 
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#3b3b3b", 
    marginBottom: 20,
    textAlign: "center",
    textShadowColor: '#fff',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#bbb",
    paddingVertical: 10,
    backgroundColor: "#cce7ff", 
    borderRadius: 8,
    marginBottom: 10,
  },
  tableHeaderText: {
    flex: 1,
    fontWeight: "bold",
    color: "#1a1a1a", 
    textAlign: "center",
    fontSize: 18,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  selectedRow: {
    backgroundColor: "#d4edda", 
  },
  tableCell: {
    flex: 1,
    textAlign: "center",
    color: "#3c3c3c", 
    fontSize: 16,
  },
  setsContainer: {
    padding: 15,
    backgroundColor: "#f9f9f9", 
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 10,
  },
  setRow: {
    flexDirection: "row",
    alignItems: 'center', 
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  setText: {
    fontSize: 16, 
    color: "#555", 
    marginRight: 10, 
  },
  setDetails: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
  },
  setWeight: {
    fontSize: 18,
    fontWeight: 'bold',
    color: "#333",
    marginRight: 5,
  },
  setReps: {
    fontSize: 16,
    color: "#666", 
  },
});

export default PastExcercisesScreen;