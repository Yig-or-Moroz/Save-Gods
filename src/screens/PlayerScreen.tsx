import React, {
   useRef,
   useState,
   useEffect,
} from 'react';

import {
   View,
   Text,
   TouchableOpacity,
   StyleSheet,
   ActivityIndicator,
   Alert,
   ScrollView,
   TextInput,
} from 'react-native';

import {
   SafeAreaView,
} from 'react-native-safe-area-context';

import CharacterEditor, {
   CharacterEditorRef,
   CharacterData,
   CharacterUpdateData,
} from '../components/CharacterEditor';

import AbilitySelector from '../components/AbilitySelector';

import Ionicons from '@expo/vector-icons/Ionicons';

import {
   AbilityCard,
   ExperienceCard,
   Player,
} from '../models/types';

import {
   getAbilityCards,
} from '../repositories/abilityCardRepository';

import {
   requirePlayer,
} from '../repositories/playerRepository';

import {
   requireGame,
} from '../repositories/gameRepository';

import {
   getCharactersForPlayer,
   getExperienceCardsForCharacterNames,
} from '../repositories/characterRepository';

import {
   savePlayerScreen,
} from '../services/gameService';

type CharacterWithCards =
   CharacterData & {
      character_name: string;
      experienceCards:
         ExperienceCard[];
   };

const PlayerScreen = ({
   navigation,
   route,
}: any) => {
   const {
      gameId,
      playerId,
      playerName,
   } = route.params;

   // =====================================================
   // STATE
   // =====================================================

   const [
      isLoading,
      setIsLoading,
   ] = useState(true);

   const [
      player,
      setPlayer,
   ] = useState<Player | null>(
      null
   );

   const [
      characters,
      setCharacters,
   ] = useState<
      CharacterWithCards[]
   >([]);

   const [
      abilityCards,
      setAbilityCards,
   ] = useState<
      AbilityCard[]
   >([]);

   const [
      teamTokens,
      setTeamTokens,
   ] = useState('');

   const [
      ability1,
      setAbility1,
   ] = useState<number | null>(
      null
   );

   const [
      ability2,
      setAbility2,
   ] = useState<number | null>(
      null
   );

   const [
      ability3,
      setAbility3,
   ] = useState<number | null>(
      null
   );

   const [
      captain,
      setCaptain,
   ] = useState(false);

   // =====================================================
   // REFS / LIFECYCLE
   // =====================================================

   const isMountedRef =
      useRef(false);

   const saveInProgressRef =
      useRef(false);

   // Зберігає поточного гравця гри.
   // Візуальний перемикач «Капітан»
   // працює як вибір поточного ходу,
   // але стан належить таблиці games.
   const currentPlayerIdRef =
      useRef<number | null>(
         null
      );

   const characterRefs =
      useRef<{
         [key: number]:
            CharacterEditorRef | null;
      }>({});

   // =====================================================
   // LOAD DATA
   // =====================================================

   useEffect(() => {
      isMountedRef.current =
         true;

      console.log(
         '[PlayerScreen] MOUNT',
         {
            gameId,
            playerId,
            playerName,
         }
      );

      let cancelled = false;

      const load =
         async () => {
            console.log(
               '[PlayerScreen] loadData START'
            );

            try {
               // -------------------------------------------------
               // PLAYER
               // -------------------------------------------------

               const playerData =
                  await requirePlayer(
                     gameId,
                     playerId
                  );

               if (
                  cancelled ||
                  !isMountedRef.current
               ) {
                  console.log(
                     '[PlayerScreen] load cancelled after player query'
                  );
                  return;
               }

               console.log(
                  '[PlayerScreen] player loaded'
               );

               setPlayer(
                  playerData
               );

               setTeamTokens(
                  playerData.team_tokens ===
                     0
                     ? ''
                     : playerData.team_tokens.toString()
               );

               setAbility1(
                  playerData.ability_card_id_1
               );

               setAbility2(
                  playerData.ability_card_id_2
               );

               setAbility3(
                  playerData.ability_card_id_3
               );

               // -------------------------------------------------
               // GAME / CURRENT PLAYER
               // -------------------------------------------------

               const game =
                  await requireGame(
                     gameId
                  );

               if (
                  cancelled ||
                  !isMountedRef.current
               ) {
                  return;
               }

               currentPlayerIdRef.current =
                  game.current_player_id;

               setCaptain(
                  game.current_player_id ===
                     playerId
               );

               // -------------------------------------------------
               // ABILITY CARDS
               // -------------------------------------------------

               console.log(
                  '[PlayerScreen] loading ability cards'
               );

               const abilityResult =
                  await getAbilityCards();

               if (
                  cancelled ||
                  !isMountedRef.current
               ) {
                  console.log(
                     '[PlayerScreen] load cancelled after ability cards'
                  );
                  return;
               }

               console.log(
                  '[PlayerScreen] ability cards loaded:',
                  abilityResult.length
               );

               setAbilityCards(
                  abilityResult
               );

               // -------------------------------------------------
               // CHARACTERS
               // -------------------------------------------------

               console.log(
                  '[PlayerScreen] loading characters'
               );

               const charsResult =
                  await getCharactersForPlayer(
                     gameId,
                     playerId
                  );

               if (
                  cancelled ||
                  !isMountedRef.current
               ) {
                  console.log(
                     '[PlayerScreen] load cancelled after characters'
                  );
                  return;
               }

               console.log(
                  '[PlayerScreen] characters loaded:',
                  charsResult.length
               );

               const characterNameIds =
                  charsResult.map(
                     (character) =>
                        character.character_name_id
                  );

               const experienceCardsByCharacter =
                  await getExperienceCardsForCharacterNames(
                     characterNameIds
                  );

               if (
                  cancelled ||
                  !isMountedRef.current
               ) {
                  return;
               }

               const experienceCardsMap =
                  new Map<
                     number,
                     ExperienceCard[]
                  >();

               for (
                  const characterNameId of
                  characterNameIds
               ) {
                  experienceCardsMap.set(
                     characterNameId,
                     experienceCardsByCharacter.filter(
                        (card) =>
                           card.character_name_id ===
                           characterNameId
                     )
                  );
               }

               const charsWithCards:
                  CharacterWithCards[] =
                  [];

               for (
                  const char of charsResult
               ) {
                  if (
                     cancelled ||
                     !isMountedRef.current
                  ) {
                     console.log(
                        '[PlayerScreen] load cancelled inside character loop'
                     );
                     return;
                  }

                  const characterName =
                     char.name ??
                     'Невідомий';

                  const experienceCards =
                     experienceCardsMap.get(
                        char.character_name_id
                     ) ?? [];

                  charsWithCards.push({
                     ...char,
                     character_name:
                        characterName,
                     experienceCards,
                  });
               }

               if (
                  cancelled ||
                  !isMountedRef.current
               ) {
                  console.log(
                     '[PlayerScreen] load cancelled before final state update'
                  );
                  return;
               }

               setCharacters(
                  charsWithCards
               );

               console.log(
                  '[PlayerScreen] loadData END'
               );
            } catch (error) {
               if (
                  cancelled ||
                  !isMountedRef.current
               ) {
                  console.log(
                     '[PlayerScreen] load error ignored after unmount'
                  );
                  return;
               }

               console.error(
                  '[PlayerScreen] loadData ERROR:',
                  error
               );

               Alert.alert(
                  'Помилка',
                  error instanceof Error
                     ? error.message
                     : 'Не вдалося завантажити дані гравця'
               );
            } finally {
               if (
                  !cancelled &&
                  isMountedRef.current
               ) {
                  setIsLoading(
                     false
                  );
               }
            }
         };

      load();

      // =====================================================
      // CLEANUP
      // =====================================================

      return () => {
         cancelled = true;

         isMountedRef.current =
            false;

         console.log(
            '[PlayerScreen] UNMOUNT',
            {
               gameId,
               playerId,
            }
         );

         characterRefs.current =
            {};
      };
   }, [
      gameId,
      playerId,
      playerName,
   ]);

   // =====================================================
   // CAPTAIN
   // =====================================================

   const handleCaptainToggle =
      async () => {
         if (
            !isMountedRef.current
         ) {
            console.log(
               '[PlayerScreen] captain toggle ignored: unmounted'
            );
            return;
         }

         // Зміна зберігається разом
         // з усіма даними екрана
         // в одній транзакції.
         setCaptain(
            (prev) => !prev
         );
      };

   // =====================================================
   // SAVE
   // =====================================================

   const handleSave =
      async () => {
         if (
            !isMountedRef.current
         ) {
            console.log(
               '[PlayerScreen] SAVE ignored: unmounted'
            );
            return;
         }

         if (
            saveInProgressRef.current
         ) {
            console.log(
               '[PlayerScreen] SAVE ignored: already in progress'
            );
            return;
         }

         saveInProgressRef.current =
            true;

         console.log(
            '[PlayerScreen] SAVE START'
         );

         try {
            // -------------------------------------------------
            // TEAM TOKENS
            // -------------------------------------------------

            const normalizedTeamTokens =
               teamTokens.trim();

            const teamTokensValue =
               normalizedTeamTokens === ''
                  ? 0
                  : Number(
                       normalizedTeamTokens
                    );

            if (
               !Number.isInteger(
                  teamTokensValue
               ) ||
               teamTokensValue < 0
            ) {
               Alert.alert(
                  'Помилка',
                  'Кількість жетонів має бути цілим невід’ємним числом'
               );
               return;
            }

            // -------------------------------------------------
            // COLLECT CHARACTER DATA
            // -------------------------------------------------

            const characterUpdates:
               Array<{
                  id: number;
                  data: CharacterUpdateData;
               }> = [];

            /*
             * ВАЖЛИВО:
             *
             * Тут БД ще НЕ змінюється.
             *
             * Ми тільки забираємо поточний
             * стан кожного CharacterEditor.
             */

            for (
               const char of characters
            ) {
               if (
                  !isMountedRef.current
               ) {
                  return;
               }

               const ref =
                  characterRefs.current[
                     char.id
                  ];

               if (!ref) {
                  throw new Error(
                     `Не вдалося отримати дані персонажа ${char.character_name}.`
                  );
               }

               const data =
                  await ref.save();

               if (
                  !isMountedRef.current
               ) {
                  return;
               }

               characterUpdates.push({
                  id: char.id,
                  data,
               });
            }

            // -------------------------------------------------
            // ONE TRANSACTION
            // -------------------------------------------------

            const savedCurrentPlayerId =
               await savePlayerScreen({
                  gameId,
                  playerId,

                  teamTokens:
                     teamTokensValue,

                  abilityCardId1:
                     ability1,

                  abilityCardId2:
                     ability2,

                  abilityCardId3:
                     ability3,

                  captain,

                  characterUpdates:
                     characterUpdates.map(
                        ({
                           id,
                           data,
                        }) => ({
                           characterId:
                              id,

                           damage:
                              data.damage,

                           fatigue:
                              data.fatigue,

                           fright:
                              data.fright,

                           madness:
                              data.madness,

                           poisoning:
                              data.poisoning,

                           weakness:
                              data.weakness,

                           lowMorale:
                              data.low_morale,

                           abilityCardId1:
                              data.ability_card_id_1,

                           abilityCardId2:
                              data.ability_card_id_2,

                           experienceCardId1:
                              data.experience_card_id_1,

                           experienceCardId2:
                              data.experience_card_id_2,

                           experienceCardId3:
                              data.experience_card_id_3,
                        })
                     ),
               });

            // -------------------------------------------------
            // UPDATE LOCAL CURRENT PLAYER
            // -------------------------------------------------

            currentPlayerIdRef.current =
               savedCurrentPlayerId;

            // -------------------------------------------------
            // SCREEN MAY HAVE BEEN UNMOUNTED
            // -------------------------------------------------

            if (
               !isMountedRef.current
            ) {
               console.log(
                  '[PlayerScreen] SAVE finished but screen is unmounted'
               );
               return;
            }

            console.log(
               '[PlayerScreen] SAVE END'
            );

            Alert.alert(
               'Успіх',
               'Дані гравця збережено!',
               [
                  {
                     text: 'ОК',

                     onPress: () => {
                        if (
                           !isMountedRef.current
                        ) {
                           console.log(
                              '[PlayerScreen] GO BACK ignored: unmounted'
                           );
                           return;
                        }

                        console.log(
                           '[PlayerScreen] GO BACK'
                        );

                        navigation.goBack();
                     },
                  },
               ]
            );
         } catch (
            error: any
         ) {
            if (
               !isMountedRef.current
            ) {
               console.log(
                  '[PlayerScreen] SAVE ERROR ignored after unmount'
               );
               return;
            }

            console.error(
               '[PlayerScreen] SAVE ERROR:',
               error
            );

            Alert.alert(
               'Помилка',
               error?.message ||
                  'Не вдалося зберегти дані'
            );
         } finally {
            saveInProgressRef.current =
               false;

            console.log(
               '[PlayerScreen] SAVE FINALLY'
            );
         }
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
   // PLAYER NOT FOUND
   // =====================================================

   if (!player) {
      return (
         <SafeAreaView
            style={styles.container}
         >
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
                     Гравець
                  </Text>
               </View>
            </View>

            <View
               style={styles.center}
            >
               <Text
                  style={
                     styles.errorText
                  }
               >
                  Гравця не знайдено
               </Text>
            </View>
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
                  {playerName}
               </Text>
            </View>
         </View>

         <ScrollView
            contentContainerStyle={
               styles.scrollContent
            }
         >
            {/* ================================================= */}
            {/* TEAM TOKENS */}
            {/* ================================================= */}

            <View
               style={[
                  styles.field,
                  styles.row,
               ]}
            >
               <Text
                  style={styles.label}
               >
                  Жетони команди:
               </Text>

               <TextInput
                  style={
                     styles.inputSmall
                  }
                  value={teamTokens}
                  onChangeText={
                     setTeamTokens
                  }
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="0"
               />
            </View>

            {/* ================================================= */}
            {/* ABILITY CARDS */}
            {/* ================================================= */}

            <View
               style={styles.field}
            >
               <Text
                  style={styles.label}
               >
                  Картки здібностей:
               </Text>

               <AbilitySelector
                  value={ability1}
                  options={
                     abilityCards
                  }
                  onChange={
                     setAbility1
                  }
               />

               <AbilitySelector
                  value={ability2}
                  options={
                     abilityCards
                  }
                  onChange={
                     setAbility2
                  }
               />

               <AbilitySelector
                  value={ability3}
                  options={
                     abilityCards
                  }
                  onChange={
                     setAbility3
                  }
               />
            </View>

            {/* ================================================= */}
            {/* CAPTAIN */}
            {/* ================================================= */}

            <View
               style={[
                  styles.field,
                  styles.row,
               ]}
            >
               <Text
                  style={styles.label}
               >
                  Капітан
               </Text>

               <TouchableOpacity
                  style={
                     styles.checkboxContainer
                  }
                  onPress={
                     handleCaptainToggle
                  }
               >
                  <View
                     style={[
                        styles.checkbox,
                        captain &&
                           styles.checkboxChecked,
                     ]}
                  />
               </TouchableOpacity>
            </View>

            {/* ================================================= */}
            {/* CHARACTERS */}
            {/* ================================================= */}

            {characters.map(
               (char) => (
                  <View
                     key={char.id}
                     style={
                        styles.characterBlock
                     }
                  >
                     <Text
                        style={
                           styles.characterName
                        }
                     >
                        {
                           char.character_name
                        }
                     </Text>

                     <CharacterEditor
                        ref={(ref) => {
                           characterRefs.current[
                              char.id
                           ] = ref;
                        }}
                        character={char}
                        abilityCards={
                           abilityCards
                        }
                        experienceCards={
                           char.experienceCards
                        }
                     />
                  </View>
               )
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

   row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
   },

   label: {
      fontSize: 18,
      fontFamily: 'Kyiv-Machine',
      color: '#004d57',
      marginLeft: 8,
      marginBottom: 8,
   },

   inputSmall: {
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      padding: 8,
      width: 60,
      fontSize: 16,
      backgroundColor: '#fff',
      textAlign: 'center',
      fontFamily: 'Kyiv-Machine',
   },

   checkboxContainer: {
      padding: 4,
   },

   checkbox: {
      width: 28,
      height: 28,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: '#004d57',
      backgroundColor: '#fff',
   },

   checkboxChecked: {
      backgroundColor: '#004d57',
   },

   characterBlock: {
      marginBottom: 20,
      backgroundColor: '#fff',
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 20,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
   },

   characterName: {
      fontSize: 20,
      fontFamily: 'Kyiv-Machine',
      color: '#004d57',
      marginBottom: 12,
      textAlign: 'center',
   },

   center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
   },

   errorText: {
      fontSize: 18,
      color: '#691716',
      fontFamily: 'Kyiv-Machine',
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
});

export default PlayerScreen;

