import { and, eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { mcpIdempotency } from '~/server/database/schema';
import { type DbExec, fail, inTx, nowTs } from './common';

const isDuplicate = (e: any) => (e?.cause?.code ?? e?.code) === 'ER_DUP_ENTRY' || /Duplicate entry/i.test(e?.cause?.message ?? e?.message ?? '');

// Kunci dan hasil ditulis satu transaksi dengan aksinya: gagal = kunci ikut rollback, retry berikutnya menjalankan ulang;
// sukses = retry dengan kunci sama mengembalikan hasil tersimpan tanpa menulis ulang.
export async function withIdempotency<T>(
  userId: string, key: string | undefined, tool: string, fn: (tx: DbExec) => Promise<T>,
): Promise<T & { idempotent_replay?: true }> {
  if (!key) return (await fn(db)) as T & { idempotent_replay?: true };
  return inTx(undefined, async (tx) => {
    try {
      await tx.insert(mcpIdempotency).values({ userId, idemKey: key, tool, resultJson: null, createdAt: nowTs() });
    } catch (e) {
      if (!isDuplicate(e)) throw e;
      const rows = await tx.select().from(mcpIdempotency)
        .where(and(eq(mcpIdempotency.userId, userId), eq(mcpIdempotency.idemKey, key))).for('update');
      const row = rows[0];
      if (!row) fail(409, 'Konflik idempotencyKey, ulangi permintaan');
      if (row.tool !== tool) fail(409, `idempotencyKey sudah dipakai oleh tool ${row.tool}`);
      if (!row.resultJson) fail(409, 'Permintaan dengan idempotencyKey ini masih berjalan');
      return { ...JSON.parse(row.resultJson), idempotent_replay: true as const };
    }
    const result = await fn(tx);
    await tx.update(mcpIdempotency).set({ resultJson: JSON.stringify(result) })
      .where(and(eq(mcpIdempotency.userId, userId), eq(mcpIdempotency.idemKey, key)));
    return result;
  });
}
