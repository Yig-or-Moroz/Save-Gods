import React, { useState } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';

import EventMildImage from '../../assets/images/event-mild.webp';
import EventPerilousImage from '../../assets/images/event-perilous.webp';
import EventDeadlyImage from '../../assets/images/event-deadly.webp';

type EventCard = {
  id: number;
  name: string;
  type: string;
  property_constantly: string | number | boolean;
};

type EventCardWithOrder = EventCard & {
  order_number: number;
  remains_in_game: number;
};

type Props = {
  cards: EventCardWithOrder[];
};

const EventCardView = ({ cards }: Props) => {
  const [expandedDecks, setExpandedDecks] = useState<{
    [key: number]: boolean;
  }>({
    1: false,
    2: false,
    3: false,
  });

  const getDeckCards = (deckIndex: number) => {
    const typeOrder = [
      'помірні',
      'небезпечні',
      'смертоносні',
    ];

    const deckCards: EventCardWithOrder[] = [];

    for (const type of typeOrder) {
      const typeCards = cards
        .filter(
          (card) =>
            card.type.toLowerCase() === type.toLowerCase()
        )
        .sort(
          (a, b) =>
            a.order_number - b.order_number
        );

      const start = deckIndex * 6;
      const end = start + 6;

      const slice = typeCards.slice(start, end);

      deckCards.push(...slice);
    }

    return deckCards;
  };

  const toggleDeck = (deckNumber: number) => {
    setExpandedDecks((prev) => ({
      ...prev,
      [deckNumber]: !prev[deckNumber],
    }));
  };

  const getTypeImage = (type: string) => {
    const lowerType = type.toLowerCase();

    if (lowerType === 'помірні') {
      return EventMildImage;
    }

    if (lowerType === 'небезпечні') {
      return EventPerilousImage;
    }

    if (lowerType === 'смертоносні') {
      return EventDeadlyImage;
    }

    return null;
  };

  const renderDeck = (deckNumber: number) => {
    const deckIndex = deckNumber - 1;
    const deckCards = getDeckCards(deckIndex);
    const isExpanded =
      expandedDecks[deckNumber] || false;

    const hasCards = deckCards.length > 0;

    return (
      <View
        key={deckNumber}
        style={styles.deckContainer}
      >
        <TouchableOpacity
          style={styles.deckHeader}
          onPress={() => toggleDeck(deckNumber)}
        >
          <Text style={styles.deckTitle}>
            Колода {deckNumber}
          </Text>

          <Text style={styles.cardCount}>
            {deckCards.length} карт
          </Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.deckContent}>
            {hasCards ? (
              deckCards.map((card) => {
                const isConstant =
                  card.remains_in_game === 1;

                const typeImage =
                  getTypeImage(card.type);

                return (
                  <View
                    key={card.id}
                    style={[
                      styles.cardItem,
                      isConstant &&
                        styles.cardItemConstant,
                    ]}
                  >
                    <Text
                      style={[
                        styles.cardName,
                        isConstant &&
                          styles.cardNameConstant,
                      ]}
                    >
                      {card.name}
                    </Text>

                    {typeImage && (
                      <Image
                        source={typeImage}
                        style={styles.typeImage}
                      />
                    )}
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>
                Колода порожня
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {cards.length === 0 ? (
        <Text style={styles.emptyDeckText}>
          Немає карток у колоді подій
        </Text>
      ) : (
        <>
          {renderDeck(1)}
          {renderDeck(2)}
          {renderDeck(3)}
        </>
      )}

      <View style={styles.cardItemConstant}>
        <Text style={styles.hint}>
          * картка залишається у грі
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f0e8',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
  },

  deckContainer: {
    marginBottom: 12,
    backgroundColor: '#f5f0e8',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  deckHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f0e8',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },

  deckTitle: {
    fontSize: 24,
    fontFamily: 'Kyiv-Machine',
    color: '#691716',
  },

  cardCount: {
    fontSize: 14,
    fontFamily: 'Kyiv-Machine',
    color: '#888',
  },

  deckContent: {
    padding: 8,
  },

  cardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#fff',
  },

  cardItemConstant: {
    backgroundColor: '#691716',
    borderStyle: 'dashed',
    borderBottomWidth: 2,
    borderTopWidth: 2,
    borderBottomColor: '#c84137',
    borderTopColor: '#c84137',
  },

  cardName: {
    fontSize: 18,
    fontFamily: 'Kyiv-Machine',
    color: '#004d57',
    flex: 1,
  },

  cardNameConstant: {
    color: '#fff',
  },

  hint: {
    fontSize: 14,
    fontFamily: 'Kyiv-Machine',
    color: '#fff',
    padding: 6,
  },

  typeImage: {
    width: 30,
    height: 30,
    marginLeft: 8,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#39090b',
  },

  emptyText: {
    fontSize: 14,
    color: '#999',
    fontFamily: 'Kyiv-Machine',
    textAlign: 'center',
    padding: 8,
  },

  emptyDeckText: {
    fontSize: 16,
    color: '#999',
    fontFamily: 'Kyiv-Machine',
    textAlign: 'center',
  },
});

export default EventCardView;

