import { db } from '../database';

export type ChestGood = {
	id: number;
	game_id: number;
	goods_id: number;
	activated: number;
};

export const getChestGoods = async (
	gameId: number
): Promise<ChestGood[]> => {
	return db.getAllAsync<ChestGood>(
		`
      SELECT id, game_id, goods_id, activated
      FROM chest_goods
      WHERE game_id = ?;
    `,
		[gameId]
	);
};

export const addChestGood = async (
	gameId: number,
	goodsId: number
): Promise<void> => {
	await db.runAsync(
		`
      INSERT INTO chest_goods (game_id, goods_id, activated)
      VALUES (?, ?, ?);
    `,
		[gameId, goodsId, 0]
	);
};

export const removeChestGood = async (
	gameId: number,
	goodsId: number
): Promise<void> => {
	await db.runAsync(
		`
      DELETE FROM chest_goods
      WHERE game_id = ? AND goods_id = ?;
    `,
		[gameId, goodsId]
	);
};

export const updateChestGoodActivated = async (
	gameId: number,
	goodsId: number,
	activated: 0 | 1
): Promise<void> => {
	await db.runAsync(
		`
      UPDATE chest_goods
      SET activated = ?
      WHERE game_id = ? AND goods_id = ?;
    `,
		[activated, gameId, goodsId]
	);
};

export const chestGoodExists = async (
	gameId: number,
	goodsId: number
): Promise<boolean> => {
	const result = await db.getFirstAsync<{ count: number }>(
		`
      SELECT COUNT(*) as count
      FROM chest_goods
      WHERE game_id = ? AND goods_id = ?;
    `,
		[gameId, goodsId]
	);

	return (result?.count ?? 0) > 0;
};