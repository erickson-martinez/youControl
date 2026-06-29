async function test() {
  const userId = 'MAD9dfISVbNVWsEWJXySOPrtkfm1';
  const API_BASE_URL = 'https://stok-5ytv.onrender.com/api/v1';
  
  const listsRes = await fetch(`${API_BASE_URL}/shopping-lists?userId=${userId}`);
  const listsData = await listsRes.json();
  
  console.log(`Found ${listsData.length} lists.`);
  if (listsData.length > 0) {
      const list = listsData[0];
      const currentListId = list._id;
      
      const itemsRes = await fetch(`${API_BASE_URL}/shopping-items?shoppingListId=${currentListId}`);
      const itemsData = await itemsRes.json();
      console.log(`List ${currentListId} has ${itemsData.length} items.`);
      
      if (itemsData.length > 0) {
          const p = itemsData[0];
          console.log("First item:", p);
          
          const value = p.price !== undefined ? Number(p.price) : (p.value !== undefined ? Number(p.value) : undefined);
          const quantity = p.quantity !== undefined ? Number(p.quantity) : undefined;
          const total = p.total !== undefined ? Number(p.total) : ((p.price !== undefined || p.value !== undefined) && p.quantity !== undefined ? Number(p.price || p.value) * Number(p.quantity) : undefined);
          
          console.log("Calculated:", { value, quantity, total });
      }
  }
}
test();
