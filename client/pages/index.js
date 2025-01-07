import React, { useEffect, useState } from "react";

export default function Index() {
  useEffect(() => {
    fetch("http://localhost:8080/")
      .then((res) => res.json())
      .then((data) => console.log(data));
  }, []);

  return <div>index</div>;
}
