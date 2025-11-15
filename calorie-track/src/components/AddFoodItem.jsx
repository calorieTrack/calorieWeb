import './AddFoodItem.css'
import { useState } from 'react'

function AddFoodItem() {
    const [outputText, setOutputText] = useState('');

    const handleSubmit = () => {
        var o1 = document.getElementById("food").value;
        setOutputText("You selected " + o1 + " option")
    }

    return (
        <>
            <form action = "">
                <label for="food-input">Enter your food:</label>
                <input list="foodname" id="food" />
                <datalist id="foodname">
                    <option value="Apple" />
                    <option value="Banana" />
                    <option value="Popcorn" />
                </datalist>
            

                <button onClick ={handleSubmit} type = "button">
                    Submit
                </button>
            </form>
            <p id="output">{outputText}</p>
        </>
    );
}
   
export default AddFoodItem;