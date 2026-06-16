import express from 'express'
import path from 'path'
import pg from 'pg';

const { Pool } = pg;
const app = express();
const filepath = path.resolve('app.html')

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'user_deposit_withdraw',
    password: 'axj0708',
    port: 5432,
});

async function getUserData(client, userid) {
    const queryText = 'SELECT * FROM users WHERE user_id = $1 FOR UPDATE';
    const result = await client.query(queryText, [userid]);

    if (result.rows.length === 0){
        throw new Error('User not found');
    }

    return result.rows[0];

   
}

async function updateUsers(client, user) {
    // 1. Convert the entire object to a JSON string
    const queryText = `
      UPDATE users
      SET user_balance = $2
      WHERE user_id = $1
    `;
    // 3. You only pass ONE thing in your array: the whole JSON payload!
    const values = [user.user_id, user.user_balance];
    await client.query(queryText, values);
    console.log(`Successfully updated users table`);
}

async function updateTransaction(client, transaction) {
    const queryText = `
      INSERT INTO transactions (amount, before_transaction, after_transaction, user_id, type_of_transaction)
      VALUES($1, $2, $3, $4, $5)
    `;
    const values = [transaction.amount, transaction.before_transaction, transaction.after_transaction, transaction.user_id, transaction.type_of_transaction]
    await client.query(queryText, values);

    console.log(`Successfully updated transactions table`);

  } 


async function deposit(userid, amount_str, client){
        console.log(userid, amount_str);
        const amount = Number(amount_str);

        const user = await getUserData(client, userid);

        const userBalance = Number(user.user_balance);
        
        console.log(user);
        const transaction = {
            amount: amount,
            before_transaction: userBalance,
            after_transaction: userBalance + amount,
            user_id: user.user_id,
            type_of_transaction: 'deposit'
        }

        user.user_balance = userBalance + amount;
        await updateTransaction(client, transaction);
        await updateUsers(client, user);
}

function checkBalance(balance, amount){
    if (balance >= amount){
        return true;
    } else{
        throw new Error('Not enough money on balance');

    }
}

async function withdraw(userid, amount_str, client){
        const user = await getUserData(client, userid);
        const amount = Number(amount_str);
        const userBalance = Number(user.user_balance);
        checkBalance(userBalance, amount);
        const transaction = {
            amount: amount,
            before_transaction: userBalance,
            after_transaction: userBalance - amount,
            user_id: user.user_id,
            type_of_transaction: 'withdraw'
        }

        user.user_balance = userBalance - amount;
        console.log('Balance updated')

        await updateTransaction(client, transaction);
        await updateUsers(client, user);
}

app.use(express.json());

app.use((req, res, next) => { req.body = req.body || {}; next(); });

app.use(express.static("public"));

app.get('/', (req, res) => {
  res.redirect("/app.html");
});



app.listen(3001);


app.post('/deposit', async function(req, res){
    const data = req.body;
    console.log(data);

    const client = await pool.connect();

    try{
        await client.query('BEGIN'); 
        await deposit(data.userid, data.amount, client);
        await client.query('COMMIT');
        return res.json({ success: true, message: "File received and balance updated!" });
    }catch (err){
        await client.query('ROLLBACK');
        console.log(err.name, err.message);
        return res.status(400).json({ success: false, error: err.message });
    } finally{
        await client.release();
    }

})

app.post('/withdraw', async function(req, res){
    const data = req.body;
    
    console.log(data);

    const client = await pool.connect();

    try{
        await client.query('BEGIN'); 
        await withdraw(data.userid, data.amount, client);
        await client.query('COMMIT');
        return res.json({ success: true, message: "File received and balance updated!" });
    }catch (err){
        await client.query('ROLLBACK')
        console.log(err.name, err.message);
        return res.status(400).json({ success: false, error: err.message });
    } finally{
        await client.release();
    }

})