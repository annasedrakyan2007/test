function checkAmount(amount){
    if (isNaN(amount)){
        throw new Error('Amount must be a number');
    }
    if (Number(amount) <= 0){
        throw new Error('Amount must be greater than 0');
    }
}


document.getElementById('transactioninfo').addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. Grab the form data
    const formData = new FormData(e.target); 

    const formProps = Object.fromEntries(formData.entries()); 

    const transactiontype = formData.get('typeoftransaction');

    const targetUrl = (transactiontype === 'deposit' ? '/deposit' : '/withdraw');

    delete formProps.typeoftransaction;

    try{
        await checkAmount(formData.get('amount'));
        const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json' // Tells backend JSON is coming
        },
        body: JSON.stringify(formProps) // Send the converted object
    });

    const result = await response.json();

    console.log(result);
    if (!response.ok){
        throw new Error(result.error || 'Something went wrong');
    }
    } catch(err){
        alert(err.message);
    }
    
});

