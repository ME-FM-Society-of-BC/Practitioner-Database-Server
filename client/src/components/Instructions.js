/**
 * A simple wrapper to contain fixed text
 */
import React from 'react';

const instructions = props => {
    const style = {maxWidth: props.width};
    if (props.paddingTop){
        style.paddingTop = props.paddingTop;
    }
    if (props.paddingBottom){
        style.paddingBottom = props.paddingBottom;
    }        

    return (
        <div className='instructions'>
            <p style={style}>
                {props.children}
            </p>
        </div>
    )
}

export default instructions;