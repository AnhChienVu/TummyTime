import React from "react";
import styles from "./growth.module.css";
import BabyCardGrowth from "@/components/BabyCardGrowth/BabyCardGrowth";

function Growth() {
  return (
    <div>
      <h1>Growth</h1>
      <BabyCardGrowth buttons={[{ name: "See Details", path: "growth" }]} />
    </div>
  );
}

export default Growth;
