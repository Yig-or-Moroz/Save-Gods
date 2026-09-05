import React from 'react';

import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

type TaskCard = {
  id: number;
  game_id: number;
  card_number: number;
  done: number;
};

type Props = {
  taskCards: TaskCard[];
};

const TaskView = ({ taskCards }: Props) => {
  const activeTasks = taskCards.filter(
    (task) => task.done === 0
  );

  const usedTasks = taskCards.filter(
    (task) => task.done === 1
  );

  const renderTaskCircle = (
    task: TaskCard,
    isActive: boolean
  ) => {
    const circleStyle = [
      styles.circle,
      isActive
        ? styles.circleActive
        : styles.circleUsed,
    ];

    const textStyle = [
      styles.circleText,
      isActive
        ? styles.circleTextActive
        : styles.circleTextUsed,
    ];

    return (
      <View
        key={task.id}
        style={circleStyle}
      >
        <Text style={textStyle}>
          {task.card_number}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Активні картки */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Активні:
          </Text>

          <Text style={styles.sectionCount}>
            {activeTasks.length}
          </Text>
        </View>

        <View style={styles.circlesContainer}>
          {activeTasks.length > 0 ? (
            activeTasks.map((task) =>
              renderTaskCircle(task, true)
            )
          ) : (
            <Text style={styles.emptyText}>
              Немає активних завдань
            </Text>
          )}
        </View>
      </View>

      {/* Використані картки */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitleUsed}>
            Використані:
          </Text>

          <Text style={styles.sectionCount}>
            {usedTasks.length}
          </Text>
        </View>

        <View style={styles.circlesContainer}>
          {usedTasks.length > 0 ? (
            usedTasks.map((task) =>
              renderTaskCircle(task, false)
            )
          ) : (
            <Text style={styles.emptyText}>
              Немає використаних завдань
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f0e8',
    padding: 16,
    borderRadius: 8,
  },

  section: {
    marginBottom: 16,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Kyiv-Machine',
    color: '#004d57',
  },

  sectionCount: {
    fontSize: 16,
    fontFamily: 'Kyiv-Machine',
    color: '#888',
    paddingHorizontal: 10,
    paddingVertical: 2,
  },

  sectionTitleUsed: {
    fontSize: 18,
    fontFamily: 'Kyiv-Machine',
    color: '#691716',
  },

  circlesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },

  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  },

  circleActive: {
    borderColor: '#004d57',
    backgroundColor: 'transparent',
  },

  circleUsed: {
    borderColor: '#004d57',
    backgroundColor: '#004d57',
  },

  circleText: {
    fontSize: 18,
    fontFamily: 'Kyiv-Machine',
  },

  circleTextActive: {
    color: '#004d57',
  },

  circleTextUsed: {
    color: '#fff',
  },

  emptyText: {
    fontSize: 14,
    color: '#999',
    fontFamily: 'Kyiv-Machine',
    textAlign: 'center',
    paddingVertical: 8,
  },
});

export default TaskView;

