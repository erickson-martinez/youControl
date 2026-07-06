const taxa = 177 / 15500;
let saldo = 15500;
let patrimonio = 15500;
let patrimonioParcelas = 0;

for (let mes = 1; mes <= 24; mes++) {
    let saldoIni = saldo;
    patrimonio *= 1 + taxa;
    
    let mesesRest = 25 - mes;
    let rend = saldoIni * taxa;
    let principal = (saldoIni / 3) / mesesRest;
    let parcela = principal + rend / 3;
    saldo = Math.max(0, saldo - principal * 3);
    
    let totalParcelas = parcela * 3;
    let rendimentoParcelasMes = patrimonioParcelas * taxa;
    patrimonioParcelas += rendimentoParcelasMes + totalParcelas;
}

console.log("Patrimonio 15500 (mes 24):", patrimonio);
console.log("Patrimonio Parcelas (mes 24):", patrimonioParcelas);
