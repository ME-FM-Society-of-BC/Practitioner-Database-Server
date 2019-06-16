/**
 * Implements the Search View
 */
import React, { Component } from 'react';
import { Panel, Button } from 'react-bootstrap';
import Selector from '../components/Selector';
import EditableText from '../components/EditableText';
import { connect } from 'react-redux';
import axios from 'axios';
import * as actions from '../store/practitionerActions';
import { STORE_PRACTITIONERS } from '../store/practitionerActions';
import Instructions from '../components/Instructions';
import { handlePostalCode } from '../common/utilities';
import { CircleSpinner } from "react-spinners-kit";

class Search extends Component {

    state = {
        postalCode: '',
        lastName: '',
        firstName: '',
        city: '',
        province: '',
        specialty: '',
        cityOptions: []
    };

    constructor(props){
        super(props);
        this.onChange= this.onChange.bind(this);
        this.onSelect = this.onSelect.bind(this);
        this.searchFull = this.searchFull.bind(this);
        this.searchQuick = this.searchQuick.bind(this);
    }

    onChange = (event) => {     
        let {name, value} = event.target;
        if (name === 'postalCode'){
            value = handlePostalCode(value);
        }
        else if (value.length === 1 && (name === 'lastName' || name === 'firstName')){
            value = value.toUpperCase();
        }
        this.setState({
            [name]: value
        });
    }

    onSelect(event){
        const {name, value} = event.target;
        this.setState({
            [name]: value
        });
        if (name === 'province'){
            this.setState({
                cityOptions: this.props.citiesMap[value]
            })
        }
    }

    // Search by criteria
    searchFull(){
        if (this.state.postalCode.length  > 0 && this.state.postalCode.length < 7){ // TODO localization
            this.setState({errorMessage: 'That is not valid postal code'});
            return;
        }
        this.setState({errorMessage: null});
        let searchParams = this.assembleSearchString(['lastName', 'firstName', 'city', 'province', 'specialty']);
        
        if (searchParams.length === 0){
            if (this.state.postalCode){
                // Postal code only- just like Quick Search
                this.searchQuick();
            }
            else {
                // Neither postal code not parameters entered
                return;
            }
        }
        else {
            // Remove trailing '|';
            searchParams = encodeURI(searchParams.substring(0, searchParams.length - 1));
            this.performSearch(searchParams);
        }
    }

    assembleSearchString(fieldsToCheck){
        return fieldsToCheck.reduce((string, fieldName) => {
            if (fieldName === 'specialty'){
                if (this.state.specialty){
                    return string.concat('specialtyId=')
                    .concat(this.props.specialties.valueToId[this.state.specialty])
                    .concat('|');
                }
                else {
                    return string;
                }
            }
            else {
                return string.concat(this.state[fieldName] ? fieldName + '=' + this.state[fieldName] +  '|' : '');
            }
        }, '');
    }

    /**  
     * Search by postal code only. This must be across all practitioners.
     */
    searchQuick(){
        if (this.state.postalCode.length < 7){ // TODO localization
            this.setState({errorMessage: 'You must enter a valid postal code'});
            return;
        }
        this.setState({errorMessage: null});

        this.getDistances(this.state.postalCode, this.props.allPractitioners)
        .then( augmentedPractitioners => {
            this.props.storePractitioners(augmentedPractitioners);
            this.proceedToListView(true);
        })
        .catch( error => {
            this.setState({
                loading: false,
                errorMessage: error
            });
        })
    }

    performSearch(searchParams){
        this.setState({
            loading: true,
            errorMessage: null
        });
        axios.get('/practitioners/search?' + searchParams)
        .then(response => {
            if (response.data.length === 0){
                this.setState({
                    loading: false,
                    errorMessage: 'No practioners were found matching those criteria'
                });
                return;
            }
            if (this.state.postalCode){
                // Since postal code also entered, we want to now do a distance search
                this.getDistances(this.state.postalCode, response.data)
                .then(augmentedPractitioners => {
                    this.setState({loading: false});
                    if (augmentedPractitioners){
                        this.proceedToListView(true, augmentedPractitioners);
                    }
                })
                .catch(error => {
                    this.setState({
                        loading: false,
                        errorMessge: error
                    });
                })
            }
            else {
                this.proceedToListView(false, response.data);
            }
        })
        .catch (error => {
            this.setState({
                loading: false,
                errorMessage: error
            });
        });
    }

    /**
     * For a given array of practtitioners, determine the distance from a specified origin
     * @param origin the origin postal code
     * @param practitioners the array of practitioners
     * @return the practitioners arrey, each member augmented with the distance
     *         null if the origin postal code was bad
     */ 
    getDistances(origin, practitioners){
        const practitionerIds = practitioners.map( practitioner => {
            return practitioner.id;
        })
        .reduce((concatenated, id, index, ids) => {
            concatenated = concatenated.concat(id).concat(index < ids.length - 1 ? '|' : '');
            return concatenated;
        }, '');

        const augmentedPractitioners = [...practitioners];

        return new Promise(function (resolve, reject) {
            axios.get('/maps?from=' + origin + '&to=' + practitionerIds)
            .then(response => {
                const distances = response.data;
                const badOriginPostalCode = distances.reduce((allBad, distance) => {
                    return allBad && distance.humanReadable === 'Not found';
                }, true);
    
                if (badOriginPostalCode){
                    // Stay here and display message
                    reject('You have entered a postal code which is invalid or cannot be found. Please try again');
                }
                else {
                    augmentedPractitioners.forEach((practitioner, i) => {
                        practitioner.distance = distances[i]; 
                    })        
                    resolve(augmentedPractitioners)        
                }
            })
            .catch (error => {
                reject('Error performing distance search');
            });
        })
    }

    proceedToListView(withDistance, matchingPractitioners){
        let queryString = '?'
        queryString += withDistance ? 'withDistance=true': '';
        queryString += matchingPractitioners ? '&matchingPractitioners=true' : '';
        if (matchingPractitioners){
            this.props.saveMatchingPractitioners(matchingPractitioners)
        }
        // TODO: Necessary?
        (new Promise(function (resolve, reject) {
            setTimeout(function () {
                resolve()
            }, 100)
        })).then(() => {
            this.props.history.push('/search-results' + queryString); 
        });
    }

    render() {
        // Display spinner during the search 
        if (this.state.loading){
            return (
                <div className='spinner-container'>
                    <CircleSpinner size={80} color="#686769" loading={this.state.loading}></CircleSpinner>
                </div>
            )
        }
        
        const panelStyle = {
            width:'90%',
            margin: 'auto',
            marginBottom: '2em'
        };

        return (
            <Panel style={panelStyle}>
            <Panel.Body>
            <div className='horizontal-group'>
            <div className='vertical-group'>
                <h4>Search for Practitioners</h4>
                <Instructions width='40em'>
                    To quickly search for any practitioners near you, just enter your postal code and click the Quick Search button
                </Instructions>
                <EditableText valueClass='info-field' labelClass='info-label' 
                        label='Postal Code' value={this.state.postalCode} 
                        name='postalCode' changeHandler={this.onChange}/>
                <br/>
                <Button onClick={this.searchQuick}>Quick Search</Button>
                <br/>
                <Instructions width='40em'>
                    <p>
                    You can also search by entering information in any of the fields below, then click the Full Search button.
                    </p>                   
                    <p>
                    If you also enter a postal code above, any practitioners matching the criteria
                    will be listed along with the distance from that postal code area.
                    </p>
                </Instructions>
                <EditableText name='lastName' 
                    valueClass='info-field' labelClass='info-label' 
                    label='Last Name' value={this.state.lastName} 
                    changeHandler={this.onChange}
                    />
                <EditableText 
                    valueClass='info-field' labelClass='info-label' 
                    label='First Name' value={this.state.firstName} 
                    name='firstName' changeHandler={this.onChange}
                    />
                <Selector 
                    label='Specialty' valueClass='info-field' labelClass='info-label' name='specialty' 
                    options={this.props.specialties.text}
                    value={this.state.specialty} 
                    placeholder='Select ...'
                    onChange =  {(event) => this.onSelect(event)}
                    />
                <Selector 
                    label='Province' valueClass='info-field' labelClass='info-label' name='province'  
                    options={this.props.provinces}
                    value={this.state.province} 
                    placeholder='Select ...'
                    onChange =  {(event) => this.onSelect(event)}
                    />
                <Selector 
                    label='City' valueClass='info-field' labelClass='info-label' name='city' 
                    options={this.props.cities}
                    value={this.state.city} 
                    placeholder='Select after province...'
                    onChange =  {(event) => this.onSelect(event)}
                    />
                <br/>
                <Button onClick={this.searchFull}>Full Search</Button>
                {
                this.state.errorMessage ?
                    <div className='error-message'>{this.state.errorMessage}</div>
                    : ''
                }

            </div>
            </div>            
            </Panel.Body>
            </Panel>
        )
    }
}

const mapStateToProps = state => {
    return {
        specialties: state.practitionersReducer.specialties,
        allPractitioners: state.practitionersReducer.allPractitioners,
        matchingPractitioners: state.practitionersReducer.matchingPractitioners,
        provinces: state.locationReducer.provinces,
        citiesMap: state.locationReducer.citiesMap
    }
}
const mapDispatchToProps = dispatch => {
    return {
        saveMatchingPractitioners: (matchingPractitioners) => dispatch({ type: actions.SAVE_SEARCH_RESULTS, matchingPractitioners }),
        storePractitioners: (practitioners) => dispatch({ type: STORE_PRACTITIONERS, practitioners })
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Search);