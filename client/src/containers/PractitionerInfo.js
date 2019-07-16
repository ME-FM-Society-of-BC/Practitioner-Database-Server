/**
 * Implements the Practitioner Information View. The cascaded id from the url
 * specifies either an existing Practitioner id, or -1 if a Practitioner is being created.
 */
import React, { Component } from 'react';
import { Panel, Button } from 'react-bootstrap';
import Selector from '../components/Selector';
import EditableText from '../components/EditableText';
import * as actions from '../store/practitionerActions';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import axios from 'axios';
import { CREATE_PRACTITIONER } from '../store/practitionerActions';
import Instructions from '../components/Instructions';
import { handlePostalCode } from '../common/utilities';

class PractitionerInfo extends Component {

    constructor(props){
        super(props);

        if (props.match.params.id >= 0){
            // An existing Practitioner is being displayed
            // Find the practitioner given the practitioner id
            let practitioner;
            for (let i = 0; i < props.practitioners.length; i++){
                // Comparison is string to number
                if (props.practitioners[i].id == props.match.params.id) {
                    practitioner = props.practitioners[i];
                    break;
                }
            }
            // Set the city list options according to province
            const cityOptions = practitioner.province ? this.props.citiesMap[practitioner.province]: [];
        
            this.state = {
                practitioner,
                cityOptions,                
                // If the user is logged , the Edit/Save buttons not be displayed
                canEdit: props.loggedInUser ? true : false,
                // When user saves, update will be sent to server only if there are changes 
                infoChanged: false,
                mode: 'view'
            }
        }
        else {
            // A new Practitioner is being created
            console.log("New Practitioner");
            this.state = {
                mode: 'create',
                practitioner: {}
            }
        }

        // Province list must be restricted to those for which there is a moderator.
        // There can be multiple moderators per province, so create map to avoid duplicates
        this.state.availableProvinces = Object.keys(
            Object.values(this.props.moderators).reduce((names, moderator) => {
                names[moderator.province] = '';
                return names;
            }, {})            
        );

        this.enableEdit = this.enableEdit.bind(this);
        this.updateInfo = this.updateInfo.bind(this);
        this.saveNew = this.saveNew.bind(this);
        this.selectSpecialty = this.selectSpecialty.bind(this);
        this.changeTextValue = this.changeTextValue.bind(this);
    }

    selectSpecialty(event) {
        const alteredPractitioner = {
            ...this.state.practitioner,
            specialty: event.target.value,
            specialtyId: this.props.specialties.valueToId[event.target.value]
        }
        this.setState({
            practitioner: alteredPractitioner,
            infoChanged: true
        })
    }

    selectProvince(event){
        const practitioner = {...this.state.practitioner};
        practitioner.province = event.target.value;
        this.setState({
            practitioner: practitioner,
            cityOptions: this.props.citiesMap[event.target.value],
            infoChanged: true,
            errorMessage: null
        })
    }

    selectCity(event){
        const practitioner = {...this.state.practitioner};
        practitioner.city = event.target.value;
        this.setState({
            practitioner: practitioner,
            infoChanged: true,
            errorMessage: null
        })
    }

    changeTextValue(event, name) {
        let value = event.target.value;
        if (name === 'postalCode'){
            value = handlePostalCode(value);
        }
        else if (value.length === 1 && (name === 'lastName' || name === 'firstName')){
            value = value.toUpperCase();
        }
        const alteredPractitioner = {...this.state.practitioner};
        alteredPractitioner[name] = value;
        this.setState({
            practitioner: alteredPractitioner,
            infoChanged: true,
            errorMessage: null
        })
    }
 
    enableEdit(){
        this.setState({
            mode:'edit'
        });
    }
    updateInfo(){
        if(!this.validate()){
            return;
        };
        if (this.state.infoChanged){
            this.props.updatePractitioner(this.state.practitioner, this.props.loggedInUser.id);
        }
        this.setState({
            mode:'view'
        });
    }

    saveNew(){
        if(!this.validate()){
            return;
        };
        // New practitioner is sent to the server here rather than in the
        // reducer action, because the id is needed immediately for routing
        const practitioner = {
            ...this.state.practitioner,
            creationDate: new Date().getTime()
        }
        axios.post('/practitioners?userId=' + this.props.loggedInUser.id, practitioner)
            .then(response => {
                practitioner.id = response.data;
                this.setState({
                    practitioner,
                    mode:'view',
                    infoChanged: false
                });
                this.props.saveNewPractitioner(this.state.practitioner);
                this.props.history.push('/practitioners/' + this.state.practitioner.id + '?newPractitioner=true');
            });
    }

    validate(){
        const fields = [];
        if (!this.state.practitioner.lastName) fields.push('last name');
        if (!this.state.practitioner.firstName) fields.push('first name');
        if (!this.state.practitioner.city) fields.push('city');
        if (!this.state.practitioner.phone) fields.push('phone');

        if (fields.length === 0){
            return true;
        }

        let errorMessage = fields.reduce( (message, field) => {
            message += field + ', ';
            return message;
        }, 'Please enter missing information: ');
        
        errorMessage = errorMessage.substring(0, errorMessage.lastIndexOf(','));
        this.setState({errorMessage});
        return false;
    }

    render() {
        const panelStyle = {
            width:'90%',
            margin: 'auto'
        };
        
        const queryParams = new URLSearchParams(this.props.location.search);
        let newPractitioner = false;
        for (let param of queryParams.entries()) {
            if (param[0] === 'newPractitioner'){
                newPractitioner = true
            }
        }
        return (
            <Panel style={panelStyle}>
            <Panel.Body>
                {this.state.mode === 'create' ?
                    <Instructions width='40em'>
                        <p>
                        Enter information for a new practitioner if you have checked that he or she is not already in the list.
                        You must provide at least first and last names, province, city and telephone number.
                        </p>
                        <p>
                        If you know it, please include the practitioner's postal code. 
                        This helps patients to search for practitioners near them.
                        Remember that you can return here later to add it or other information.   
                        </p>
                    </Instructions>
                    : ''
                }
                <div className='horizontal-group'>
                    <div className='vertical-group'>
                    <EditableText valueClass='info-field' labelClass='info-label' 
                        label='Last Name'  mode={this.state.mode} value={this.state.practitioner.lastName} placeholder='Last name'
                        attribute='lastName' changeHandler =  {(event) => this.changeTextValue(event, 'lastName')}/>
                    <EditableText valueClass='info-field' labelClass='info-label' 
                        label='First Name'  mode={this.state.mode} value={this.state.practitioner.firstName} placeholder='First name'
                        attribute='firstName' changeHandler =  {(event) => this.changeTextValue(event, 'firstName')}/>
                    <EditableText valueClass='info-field' labelClass='info-label' 
                        label='Address'  mode={this.state.mode} value={this.state.practitioner.address} placeholder='Street address'
                        attribute='address' changeHandler =  {(event) => this.changeTextValue(event, 'address')}/>
                    <Selector label='Province'
                        valueClass='info-field' labelClass='info-label'  
                        mode={this.state.mode} 
                        options={this.state.availableProvinces}
                        value={this.state.practitioner.province} 
                        placeholder='Select ...'
                        onChange =  {(event) => this.selectProvince(event)}/>
                    <Selector label='City'
                        valueClass='info-field' labelClass='info-label'  
                        mode={this.state.mode} 
                        options={this.state.cityOptions}
                        value={this.state.practitioner.city} 
                        placeholder='Select after province...'
                        onChange =  {(event) => this.selectCity(event)}/>
                    </div>
                    <div className='vertical-group'>    
                    <EditableText valueClass='info-field' labelClass='info-label' 
                        label='Country'  mode={this.state.mode} value={this.state.practitioner.country} placeholder='Country'
                        attribute='country' changeHandler =  {(event) => this.changeTextValue(event, 'country')}/>
                    <EditableText valueClass='info-field' labelClass='info-label' 
                        label='Postal Code'  mode={this.state.mode} value={this.state.practitioner.postalCode} placeholder='Postal code'
                        attribute='postalCode' changeHandler =  {(event) => this.changeTextValue(event, 'postalCode')}/>
                    <EditableText valueClass='info-field' labelClass='info-label' 
                        label='Phone'  mode={this.state.mode} value={this.state.practitioner.phone} placeholder='Phone number'
                        attribute='phone' changeHandler =  {(event) => this.changeTextValue(event, 'phone')}/>
                    <EditableText valueClass='info-field' labelClass='info-label' 
                        label='Website'  mode={this.state.mode} value={this.state.practitioner.website} placeholder='Website'
                        attribute='website' changeHandler =  {(event) => this.changeTextValue(event, 'website')}
                        type={this.state.mode === 'view' ? 'url' : 'text'}/>
 
                    <Selector label='Specialty'
                        valueClass='info-field' labelClass='info-label'  
                        mode={this.state.mode} 
                        type='react-select'
                        options={this.props.specialties.text}
                        value={this.state.practitioner.specialty} 
                        placeholder='Select one...'
                        onChange =  {(event) => this.selectSpecialty(event)}/>
                    </div>
                </div>
                {
                    this.state.errorMessage ? <div className='error-message'>{this.state.errorMessage}</div> : ''
                }

                {this.state.canEdit ?
                    <div className='horizontal-group'>
                        {
                            this.state.mode === 'view' ?
                            <Button type="button" className='button-large' onClick={this.enableEdit}>Edit Practitioner Information</Button>
                            :
                            <Button type='button' className='button-large' onClick={this.updateInfo}>Save Practitioner Information</Button>
                        }
                    </div>
                    : <></>
                }
                {this.state.mode === 'create' ?
                    <Button type="button" className='button-large' onClick={this.saveNew}>Save Practitioner Information</Button>
                    : ''
                }
                {newPractitioner === true ?
                    <Instructions width='30em'>
                        You can now provide an evaluation for this Practitioner
                        Remember you can always return later and create or modify you evaluation
                    </Instructions> 
                : ''}
            </Panel.Body>           
            </Panel>
        )
    }
}

const mapStateToProps = state => {
    return {
        practitioners: state.practitionersReducer.allPractitioners,
        specialties: state.practitionersReducer.specialties,
        idToIndex: state.practitionersReducer.practitionerIdsToIndices,
        moderators: state.userReducer.moderators,
        loggedInUser: state.userReducer.loggedInUser,
        allProvinces: state.locationReducer.provinces,
        citiesMap: state.locationReducer.citiesMap,
        provinceNamesToIdMap: state.locationReducer.provinceNamesToIdMap
    }
}
const mapDispatchToProps = dispatch => {
    return {
        updatePractitioner: (practitioner, userId) => dispatch(actions.updatePractitioner(practitioner, userId)),
        saveNewPractitioner: (practitioner) => dispatch({ type: CREATE_PRACTITIONER, practitioner: practitioner })
    };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(PractitionerInfo));
