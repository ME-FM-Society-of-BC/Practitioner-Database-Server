/**
 * Implements the Comments View, displaying all approved comments for a practitioner.
 * Comments are arranged in a two level hierarchy. The second level contains any 
 * comments entered as responses to a given comment. The comment of a user who responds 
 * to a second level comment will appear on the second level. 
 */
import React, { Component } from 'react';
import { Button } from 'react-bootstrap';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import Comment from '../components/Comment';
import NewComment from '../components/NewComment';
import * as actions from '../store/commentActions';

class PractitionerComments extends Component {

    state = {}

    constructor(props) {
        super(props);
        this.openComment = this.openComment.bind(this);
        this.saveComment = this.saveComment.bind(this);
        this.closeComment = this.closeComment.bind(this);
        this.reply = this.reply.bind(this);
        this.onChange = this.onChange.bind(this);
    }
 
    render() {
        // Comments for this practitioner
        const commentMap = this.props.allComments[this.props.match.params.id];
        // Flaten out
        let comments = [];
        for (let id in commentMap){
            comments = comments.concat([commentMap[id].comment], commentMap[id].responses)
        }

        return (
            <>
            <Button type="button" className='button-large' onClick={this.openComment}>Add a New Comment</Button>
            
            <NewComment show={this.state.showModal} 
                onSave={this.saveComment} 
                onCancel={this.closeComment}
                onChange={this.onChange} 
                value={this.state.commentText}/>
            
            <div className='comments'>
                {
                comments.map((comment, index) => {
                    const username = this.props.allUsers[comment.userId].username;
                    return (
                        <Comment mode='view' 
                            level={comment.parentId ? 2 : 1} 
                            text={comment.text} key={index}
                            username={username}
                            date={comment.date}
                            onClickReply={() => this.reply(comment.id)}/>
                    )
                })
                }
            </div>
            </>
        )
    }

    openComment() { 
        this.setState({ 
            showModal: true,
            commentText: ''
        }) 
    }

    closeComment() { 
        this.setState({ 
            showModal: false,
            commentText: '',
            parentId: null
        }) 
    }

    onChange(event) {
        console.log(event.target.value);
        this.setState({ 
            ...this.state,
            commentText: event.target.value
        }) 
    } 

    saveComment() {
        this.props.saveComment({
            parentId: this.state.parentId,
            practitionerId: this.props.match.params.id,
            userId: this.props.loggedInUser.id,
            date: new Date(),
            text: this.state.commentText,
            approved: false
        })
        this.closeComment();
    }

    /** User has clicked the "Reply" button on a specific comment */
    reply(parentId) {
        this.setState({ 
            showModal: true,
            commentText: '',
            parentId: parentId
        }) 
    }
}

const mapStateToProps = state => {
    return {
        loggedInUser: state.userReducer.loggedInUser,
        allUsers: state.userReducer.allUsers,
        allComments: state.commentReducer.allComments
    }
}

const mapDispatchToProps = dispatch => {
    return {
        saveComment: (comment) => dispatch(actions.saveComment(comment))
    }
}

export default  withRouter(connect(mapStateToProps, mapDispatchToProps)(PractitionerComments));
