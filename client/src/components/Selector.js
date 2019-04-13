/**
* A wrapper for a (single) select control . 
* Its behaviour depends on the mode property as follows:
* 'view':   renders disabled, displaying the current value
* 'viewAll':renders as a star rating according to the values in the answers property
* 'edit':   renders as a selector, with the current value
* 
* Additional props:
* name:                 optional control name               
* label:                the control label
* labelClass:           label style class
* valueClass:           value style class
* options:              array of option text values
* selectHandler:        function to receive the onChange event     
* dimensions:           12-column grid dimensions of the label and options list in format "x1,x2[,x3]"
*                       where x1 = column width of label
*                        x2 = column width of the value
*                        x3 = column odffset of label (optional)
*                       if not included, the default value is "3:9"
* answers               array of all values that have been selected for the question, if any
* value:                the current selected value
*/
import React from 'react';
import { parseDimensions } from '../common/utilities';
import StarRating from './StarRating';
import Select from 'react-select';

const selector = (props) => {
    
    let labelClasses = props.labelClass;
    let valueClasses = props.valueClass;
    if (props.dimensions){
        let d = parseDimensions(props.dimensions);
        labelClasses += ' ' + d.labelWidth + ' ' + d.labelOffset;
        valueClasses += ' ' + d.valueWidth;
    }

    let options = props.options;
    if (!props.type || props.type === 'select'){
        options = [props.placeholder].concat(options);
    }

    let component = undefined;
    if (props.mode === 'viewAll'){
        if (props.answers) {
            let sum = props.answers.reduce((sum, answer) => {
                // Choice values start at zero, so add an offset 
                return sum + answer + 1;
            }, 0);
            let value = props.answers.length === 0 ? 0 : sum / props.answers.length;
            // TODO Number of answers may vary in the future, so scale to 5
            // Requires acces to the choice set for the question 
            component = <StarRating className={valueClasses} value={value}/>
        }
        else {
            component = <span className={valueClasses}>No answers</span>
        }
    }
    else {
        if (props && props.type === 'react-select'){
            component = (
            <Select
                className={valueClasses}
                options={props.options}
                onInputChange={props.onChange}
            /> 
            )
        }
        else {
            component = (
            <select
                name={props.name}
                disabled={props.mode === 'view'} 
                onChange={(event) => props.onChange(event)} 
                className={valueClasses}
                value={props.value}>
                {
                    options.map((text, index) => {
                        return (<option value={text} key={index} >{text}</option>)
                    }, this)
                }
            </select>
            )
        }  
     }
        
    return (
        <div className='input-wrapper'>
            <span className={labelClasses}>{props.label}</span>
            {component}
            </div>
    )
}
        
export default selector;
        