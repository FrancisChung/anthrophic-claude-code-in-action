import { open } from "sqlite";
import sqlite3 from "sqlite3";

import { createSchema } from "./schema";
import { getOrdersPendingLongerThan } from "./queries/order_queries";

async function main() {
  const db = await open({
    filename: "ecommerce.db",
    driver: sqlite3.Database,
  });

  await createSchema(db, false);

  const stalePendingOrders = await getOrdersPendingLongerThan(db, 3);

  console.log("Orders pending longer than 3 days:");
  console.log(stalePendingOrders);
}

main();
