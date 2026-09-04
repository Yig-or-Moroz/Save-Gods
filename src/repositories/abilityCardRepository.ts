import { db } from '../database';
import { AbilityCard } from '../models/types';

export async function getAbilityCards(): Promise<AbilityCard[]> {
return db.getAllAsync<AbilityCard>(
'SELECT id, name FROM ability_cards ORDER BY name;'
);
}

export async function getAbilityCard(
id: number
): Promise<AbilityCard | null> {
return db.getFirstAsync<AbilityCard>(
'SELECT id, name FROM ability_cards WHERE id = ?;',
id
);
}

export async function requireAbilityCard(
id: number
): Promise<AbilityCard> {
const card = await getAbilityCard(id);

if (!card) {
throw new Error(
`Картку здібності з id ${id} не знайдено`
);
}

return card;
}
