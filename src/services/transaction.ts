import { db } from '../database';

/**
 * expo-sqlite transactions are serialized here at the service layer.
 * This prevents overlapping withTransactionAsync calls from racing each
 * other when the user taps actions quickly.
 */
let transactionQueue: Promise<void> = Promise.resolve();

export async function runInTransaction<T>(
	callback: () => Promise<T>
): Promise<T> {
	let result!: T;
	let thrownError: unknown;

	const operation = transactionQueue.then(async () => {
		try {
			await db.withTransactionAsync(async () => {
				result = await callback();
			});
		} catch (error) {
			thrownError = error;
		}
	});

	// Always release the queue, even when this transaction fails.
	transactionQueue = operation.then(
		() => undefined,
		() => undefined
	);

	await operation;

	if (thrownError !== undefined) {
		throw thrownError;
	}

	return result;
}
