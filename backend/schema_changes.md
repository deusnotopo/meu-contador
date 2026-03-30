# Schema Changes for Data Trust (P0)

Add the following to schema.prisma after the datasource block:

```prisma
enum DataReliability {
  REAL
  ESTIMATED
  HEURISTIC
  BENCHMARK
  EXTERNAL_SOURCE
}
```

In the Transaction model, add after createdAt:

```prisma
  dataReliability DataReliability @default(REAL)
```

In the Debt model, add after userId:

```prisma
  dataReliability DataReliability @default(REAL)
```

In the Investment model, add after userId:

```prisma
  dataReliability DataReliability @default(REAL)
```

After changes, run `npm run db:migrate` in backend directory.
