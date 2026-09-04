import React, { useState, useEffect } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import {
  getEditPlayersScreen,
  changePlayers,
  type EditablePlayer,
  type EditableCharacterAssignment,
} from '../services/gameService';

// =====================================================
// TYPES
// =====================================================

type Character = {
  id: number;
  name: string;
};

type Player = EditablePlayer;

type CharacterFull = EditableCharacterAssignment;

// =====================================================
// COMPONENT
// =====================================================

const EditPlayersScreen = ({ navigation, route }: any) => {
  const { gameId } = route.params;

  // =====================================================
  // STATE
  // =====================================================

  const [isLoading, setIsLoading] = useState(true);

  const [allCharacters, setAllCharacters] =
    useState<Character[]>([]);

  const [players, setPlayers] =
    useState<Player[]>([]);

  const [characters, setCharacters] =
    useState<CharacterFull[]>([]);

  // Modal для видалення гравця
  const [removeModalVisible, setRemoveModalVisible] =
    useState(false);

  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getEditPlayersScreen(gameId);

      setPlayers(data.players);
      setCharacters(data.characters);
      setAllCharacters(data.characterNames);
    } catch (error) {
      Alert.alert(
        'Помилка',
        'Не вдалося завантажити дані'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // ADD PLAYER
  // =====================================================

  const addPlayer = () => {
    if (players.length >= 4) {
      Alert.alert(
        'Увага',
        'Максимум 4 гравці'
      );
      return;
    }

    const newPlayer: Player = {
      // Тимчасовий ID потрібен, поки гравець ще не вставлений у БД.
      // Він має бути унікальним, щоб кільком новим гравцям можна було
      // незалежно призначати персонажів до натискання «Зберегти».
      id: Math.min(0, ...players.map((player) => player.id)) - 1,
      name: '',
      team_tokens: 0,
      ability_card_id_1: null,
      ability_card_id_2: null,
      ability_card_id_3: null,
    };

    setPlayers([
      ...players,
      newPlayer,
    ]);
  };

  // =====================================================
  // REMOVE PLAYER
  // =====================================================

  const removePlayer = () => {
    if (players.length <= 1) {
      Alert.alert(
        'Увага',
        'Повинен бути хоча б один гравець'
      );
      return;
    }

    // Власний Modal замість Alert зі списком кнопок.
    setRemoveModalVisible(true);
  };

  // =====================================================
  // CONFIRM REMOVE PLAYER
  // =====================================================

  const confirmRemovePlayer = (
    indexToRemove: number
  ) => {
    const removedPlayer =
      players[indexToRemove];

    if (!removedPlayer) {
      return;
    }

    Alert.alert(
      'Підтвердження',
      `Ви впевнені, що хочете видалити гравця "${removedPlayer.name || 'Без імені'}"? Його персонажі стануть безхазяйними і їх можна буде призначити іншим гравцям.`,
      [
        {
          text: 'Скасувати',
          style: 'cancel',
        },
        {
          text: 'Видалити',
          style: 'destructive',
          onPress: () => {
            const updatedPlayers = [
              ...players,
            ];

            const removed =
              updatedPlayers.splice(
                indexToRemove,
                1
              );

            if (removed.length === 0) {
              return;
            }

            const removedPlayerId =
              removed[0].id;

            const updatedCharacters =
              characters.map(
                (c) => {
                  if (
                    c.player_id ===
                    removedPlayerId
                  ) {
                    return {
                      ...c,
                      player_id: null,
                    };
                  }

                  return c;
                }
              );

            setPlayers(
              updatedPlayers
            );

            setCharacters(
              updatedCharacters
            );

            setRemoveModalVisible(
              false
            );
          },
        },
      ]
    );
  };

  // =====================================================
  // TOGGLE CHARACTER
  // =====================================================

  const toggleCharacter = (
    playerId: number,
    characterId: number
  ) => {
    const charIndex =
      characters.findIndex(
        (c) =>
          c.character_name_id ===
          characterId
      );

    if (charIndex === -1) {
      return;
    }

    const char =
      characters[charIndex];

    // Якщо персонаж уже належить цьому
    // гравцю — знімаємо призначення.
    if (
      char.player_id ===
      playerId
    ) {
      const updated = [
        ...characters,
      ];

      updated[charIndex] = {
        ...char,
        player_id: null,
      };

      setCharacters(updated);

      return;
    }

    // Призначаємо персонажа цьому гравцю.
    const updated =
      characters.map((c) => {
        if (
          c.character_name_id ===
          characterId
        ) {
          return {
            ...c,
            player_id:
              playerId,
          };
        }

        return c;
      });

    setCharacters(updated);
  };

  // =====================================================
  // GET PLAYER CHARACTERS
  // =====================================================

  const getPlayerCharacters = (
    playerId: number
  ) => {
    return characters.filter(
      (c) =>
        c.player_id ===
        playerId
    );
  };

  // =====================================================
  // SAVE
  // =====================================================

  const handleSave = async () => {
    try {
      await changePlayers({
        gameId,
        players,
        characters,
      });

      // -------------------------------------------------
      // SUCCESS
      // -------------------------------------------------

      Alert.alert(
        'Успіх',
        'Зміни збережено!',
        [
          {
            text: 'ОК',
            onPress: () =>
              navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Помилка',
        error instanceof Error
          ? error.message
          : 'Не вдалося зберегти зміни'
      );
    }
  };

  // =====================================================
  // CHARACTER AVAILABLE
  // =====================================================

  const isCharacterAvailable = (
    playerId: number,
    characterId: number
  ): boolean => {
    const char =
      characters.find(
        (c) =>
          c.character_name_id ===
          characterId
      );

    if (!char) {
      return false;
    }

    return (
      char.player_id === null ||
      char.player_id === playerId
    );
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (isLoading) {
    return (
      <SafeAreaView
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#004d57"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Завантаження...
        </Text>
      </SafeAreaView>
    );
  }

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <SafeAreaView
      style={styles.container}
    >
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <View
        style={
          styles.headerWrapper
        }
      >
        <View
          style={
            styles.backButtonWrapper
          }
        >
          <TouchableOpacity
            onPress={() =>
              navigation.goBack()
            }
            style={
              styles.backButton
            }
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#004d57"
            />
          </TouchableOpacity>
        </View>

        <View
          style={
            styles.titleWrapper
          }
        >
          <Text
            style={
              styles.header
            }
          >
            Змінити гравців
          </Text>
        </View>
      </View>

      {/* ================================================= */}
      {/* CONTENT */}
      {/* ================================================= */}

      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
      >
        {/* ================================================= */}
        {/* NUMBER OF PLAYERS */}
        {/* ================================================= */}

        <View style={styles.field}>
          <Text
            style={
              styles.label
            }
          >
            Кількість гравців
          </Text>

          <View
            style={
              styles.radioGroup
            }
          >
            <TouchableOpacity
              style={
                styles.radioButton
              }
              onPress={
                removePlayer
              }
            >
              <Text
                style={
                  styles.radioText
                }
              >
                ➖
              </Text>
            </TouchableOpacity>

            <Text
              style={
                styles.counterText
              }
            >
              {players.length}
            </Text>

            <TouchableOpacity
              style={
                styles.radioButton
              }
              onPress={
                addPlayer
              }
            >
              <Text
                style={
                  styles.radioText
                }
              >
                ➕
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ================================================= */}
        {/* PLAYERS */}
        {/* ================================================= */}

        {players.map(
          (
            player,
            index
          ) => {
            const playerChars =
              getPlayerCharacters(
                player.id
              );

            return (
              <View
                key={`${player.id}-${index}`}
                style={
                  styles.playerBlock
                }
              >
                <Text
                  style={
                    styles.playerTitle
                  }
                >
                  {index ===
                  0
                    ? 'Перший'
                    : index ===
                      1
                    ? 'Другий'
                    : index ===
                      2
                    ? 'Третій'
                    : 'Четвертий'}{' '}
                  гравець
                </Text>

                <TextInput
                  style={
                    styles.input
                  }
                  value={
                    player.name
                  }
                  onChangeText={(
                    text
                  ) => {
                    const updated = [
                      ...players,
                    ];

                    updated[
                      index
                    ] = {
                      ...updated[
                        index
                      ],
                      name: text,
                    };

                    setPlayers(
                      updated
                    );
                  }}
                  placeholder="Ім'я гравця"
                />

                <View
                  style={
                    styles.checkboxGroup
                  }
                >
                  {allCharacters.map(
                    (
                      char
                    ) => {
                      const available =
                        isCharacterAvailable(
                          player.id,
                          char.id
                        );

                      const isSelected =
                        playerChars.some(
                          (
                            c
                          ) =>
                            c.character_name_id ===
                            char.id
                        );

                      return (
                        <TouchableOpacity
                          key={
                            char.id
                          }
                          style={[
                            styles.checkboxRow,
                            !available &&
                              styles.checkboxRowDisabled,
                          ]}
                          onPress={() =>
                            available &&
                            toggleCharacter(
                              player.id,
                              char.id
                            )
                          }
                          activeOpacity={
                            available
                              ? 0.7
                              : 1
                          }
                          disabled={
                            !available
                          }
                        >
                          <View
                            style={[
                              styles.checkbox,
                              isSelected &&
                                styles.checkboxChecked,
                              !available &&
                                styles.checkboxDisabled,
                            ]}
                          />

                          <Text
                            style={[
                              styles.checkboxLabel,
                              !available &&
                                styles.checkboxLabelDisabled,
                            ]}
                          >
                            {
                              char.name
                            }
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  )}
                </View>
              </View>
            );
          }
        )}

        {/* ================================================= */}
        {/* SAVE */}
        {/* ================================================= */}

        <TouchableOpacity
          style={
            styles.saveButton
          }
          onPress={
            handleSave
          }
        >
          <Text
            style={
              styles.saveButtonText
            }
          >
            Зберегти
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ================================================= */}
      {/* REMOVE PLAYER MODAL */}
      {/* ================================================= */}

      <Modal
        visible={
          removeModalVisible
        }
        transparent={true}
        animationType="fade"
        onRequestClose={() =>
          setRemoveModalVisible(
            false
          )
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.removeModal
            }
          >
            {/* TITLE */}

            <Text
              style={
                styles.removeModalTitle
              }
            >
              Видалення гравця
            </Text>

            <Text
              style={
                styles.removeModalText
              }
            >
              Оберіть гравця, якого
              потрібно видалити:
            </Text>

            {/* PLAYERS */}

            {players.map(
              (
                player,
                index
              ) => (
                <TouchableOpacity
                  key={`${player.id}-${index}`}
                  style={
                    styles.removePlayerButton
                  }
                  activeOpacity={
                    0.7
                  }
                  onPress={() =>
                    confirmRemovePlayer(
                      index
                    )
                  }
                >
                  <Text
                    style={
                      styles.removePlayerButtonText
                    }
                  >
                    {index + 1}
                    .{' '}
                    {
                      player.name ||
                      'Без імені'
                    }
                  </Text>
                </TouchableOpacity>
              )
            )}

            {/* CANCEL */}

            <TouchableOpacity
              style={
                styles.removeCancelButton
              }
              activeOpacity={
                0.7
              }
              onPress={() =>
                setRemoveModalVisible(
                  false
                )
              }
            >
              <Text
                style={
                  styles.removeCancelButtonText
                }
              >
                Скасувати
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f0e8',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f0e8',
  },

  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#004d57',
    fontFamily: 'Kyiv-Machine',
  },

  headerWrapper: {
    flexDirection: 'column',
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#f5f0e8',
    borderBottomWidth: 1,
    borderBottomColor: '#004d57',
  },

  backButtonWrapper: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#004d57',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },

  titleWrapper: {
    alignSelf: 'center',
    width: '100%',
    marginBottom: 16,
  },

  header: {
    fontSize: 28,
    fontFamily: 'Kyiv-Machine',
    color: '#004d57',
    textAlign: 'center',
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  field: {
    marginBottom: 20,
  },

  label: {
    fontSize: 18,
    fontFamily: 'Kyiv-Machine',
    color: '#004d57',
    marginBottom: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },

  radioGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  radioButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#004d57',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },

  radioText: {
    fontSize: 24,
    color: '#004d57',
    fontFamily: 'Kyiv-Machine',
  },

  counterText: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#004d57',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 25,
    color: '#fff',
    fontFamily: 'Kyiv-Machine',
  },

  playerBlock: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  playerTitle: {
    fontSize: 18,
    fontFamily: 'Kyiv-Machine',
    color: '#004d57',
    marginBottom: 10,
  },

  checkboxGroup: {
    marginTop: 8,
  },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },

  checkboxRowDisabled: {
    opacity: 0.4,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#004d57',
    marginRight: 10,
    backgroundColor: '#fff',
  },

  checkboxChecked: {
    backgroundColor: '#004d57',
  },

  checkboxDisabled: {
    borderColor: '#aaa',
    backgroundColor: '#eee',
  },

  checkboxLabel: {
    fontSize: 18,
    fontFamily: 'Kyiv-Machine',
    color: '#004d57',
  },

  checkboxLabelDisabled: {
    color: '#aaa',
  },

  saveButton: {
    backgroundColor: '#691716',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },

  saveButtonText: {
    fontSize: 20,
    color: '#fff',
    fontFamily: 'Kyiv-Machine',
    letterSpacing: 1,
  },

  // =====================================================
  // REMOVE PLAYER MODAL
  // =====================================================

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  removeModal: {
    width: '100%',
    backgroundColor: '#f5f0e8',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#004d57',
    elevation: 8,
  },

  removeModalTitle: {
    fontSize: 22,
    fontFamily: 'Kyiv-Machine',
    color: '#004d57',
    textAlign: 'center',
    marginBottom: 10,
  },

  removeModalText: {
    fontSize: 16,
    fontFamily: 'Kyiv-Machine',
    color: '#004d57',
    textAlign: 'center',
    marginBottom: 16,
  },

  removePlayerButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#004d57',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
  },

  removePlayerButtonText: {
    fontSize: 18,
    fontFamily: 'Kyiv-Machine',
    color: '#004d57',
    textAlign: 'center',
  },

  removeCancelButton: {
    backgroundColor: '#691716',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 8,
  },

  removeCancelButtonText: {
    fontSize: 18,
    fontFamily: 'Kyiv-Machine',
    color: '#fff',
    textAlign: 'center',
  },
});

export default EditPlayersScreen;



