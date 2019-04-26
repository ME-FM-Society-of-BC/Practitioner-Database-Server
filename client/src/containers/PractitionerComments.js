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
        this.flag = this.flag.bind(this);
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
            {this.props.loggedInUser ? 
                <Button type="button" className='button-large' onClick={this.openComment}>Add a New Comment</Button>
                : ''
            }
            
            <NewComment show={this.state.showModal} 
                onSave={this.saveComment} 
                onCancel={this.closeComment}
                onChange={this.onChange} 
                value={this.state.commentText}/>
            
            {
            comments.length === 0 ?
            <div className='instructions'><p style={{maxWidth: '40em'}}>
                There are no comments on this practitioner
                </p>
            </div>
            :
            <div className='comments'>
                {
                comments.map((comment, index) => {
                    const username = this.props.allUsers[comment.userId].username;
                    return (
                        <Comment mode='view' 
                            level={comment.parentId ? 2 : 1} 
                            text={comment.text} 
                            key={index}
                            username={username}
                            date={comment.date}
                            status={comment.status}
                            onClickReply={() => this.reply(comment.id)}
                            onClickFlag={() => this.flag(comment)}/>
                    )
                })
                }
            </div>
            }
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
        this.setState({ 
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
            status: 'PENDING'
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
    /** User has clicked the "Flag" button on a specific comment */
    flag(comment) {
        comment.status = 'FLAGGED';
        this.props.updateComment(comment);
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
        saveComment: (comment) => dispatch(actions.saveComment(comment)),
        updateComment: (comment) => dispatch(actions.updateComment(comment))
    }
}

export default  withRouter(connect(mapStateToProps, mapDispatchToProps)(PractitionerComments));
