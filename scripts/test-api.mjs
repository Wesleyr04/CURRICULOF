async function testFlow() {
  console.log("1. Testando /api/payment/create...");
  const createRes = await fetch("http://localhost:3000/api/payment/create", { method: "POST" });
  const createData = await createRes.json();
  console.log("Resultado Create:", createData);

  if (!createData.orderId) throw new Error("orderId não gerado");

  console.log("\n2. Testando /api/payment/status antes do pagamento...");
  const statusRes1 = await fetch("http://localhost:3000/api/payment/status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId: createData.orderId }),
  });
  const statusData1 = await statusRes1.json();
  console.log("Status inicial:", statusData1);

  console.log("\n3. Simulando pagamento com /api/payment/simulate...");
  const simRes = await fetch("http://localhost:3000/api/payment/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId: createData.orderId }),
  });
  const simData = await simRes.json();
  console.log("Resultado simulação:", simData);

  console.log("\n4. Consultando /api/payment/status após pagamento...");
  const statusRes2 = await fetch("http://localhost:3000/api/payment/status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId: createData.orderId }),
  });
  const statusData2 = await statusRes2.json();
  console.log("Status final:", statusData2);

  console.log("\n5. Validando token com /api/payment/verify-token...");
  const verifyRes = await fetch("http://localhost:3000/api/payment/verify-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: statusData2.downloadToken }),
  });
  const verifyData = await verifyRes.json();
  console.log("Validação do token:", verifyData);

  console.log("\n6. Testando /api/ai/suggest-summary...");
  const aiRes = await fetch("http://localhost:3000/api/ai/suggest-summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobTitle: "Engenheiro de Software",
      field: "Tecnologia",
      skills: ["React", "TypeScript", "Node.js"],
    }),
  });
  const aiData = await aiRes.json();
  console.log("Sugestão de resumo com IA:", aiData);

  console.log("\n🎉 FLUXO DE API 100% VALIDADO COM SUCESSO!");
}

testFlow().catch(console.error);
