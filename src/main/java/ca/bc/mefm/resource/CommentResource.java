package ca.bc.mefm.resource;

import java.util.List;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.QueryParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import ca.bc.mefm.data.Comment;
import ca.bc.mefm.data.DataAccess;
import ca.bc.mefm.data.DataAccess.Filter;

/**
 * Service endpoint for Comment entity creation and retrieval
 * @author Robert
 */
@Path("/comments")
public class CommentResource extends AbstractResource{

    /**
     * Creates a new Comment
     * @param Comment
     * @return
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    public Response create(Comment comment) {    	
        DataAccess da = new DataAccess();
        da.ofyPut(comment);
        return responseCreated(comment.getId());
    }

    /**
     * Updates a Comment
     * @param Comment
     * @return
     */
    @PUT
    @Consumes(MediaType.APPLICATION_JSON)
    public Response update(Comment comment) {    	
        DataAccess da = new DataAccess();
        da.ofyPut(comment);
        return responseNoContent();
    }
    
    @Path("resolve")
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    public Response resolve(List<Comment> comments) {
    	DataAccess da = new DataAccess();
    	comments.stream().forEach( comment -> {
    		da.ofyPut(comment);
    	});
        return responseNoContent();
    }
    
    /**
     * Fetches all Comments with a specified status
     * @param status
     * @return
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response getByStatus(@QueryParam("status") Comment.Status status){
        DataAccess da = new DataAccess();
        DataAccess.Filter[] filters = new DataAccess.Filter[] {
        		new Filter("status", status)	
        };
        List<Comment> list = da.getAllByFilters(Comment.class, filters);
        return responseOkWithBody(list);
    }

    /**
     * Fetches all Comments for a specified practitioner
     * @param id
     * @return
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("{practitionerId}")
    public Response getByPractitioner(@PathParam("practitionerId") Long practitionerId){
        DataAccess da = new DataAccess();
        DataAccess.Filter[] filters = new DataAccess.Filter[] {
        		new Filter("practitionerId ==", practitionerId)	
        };
        List<Comment> list = da.getAllByFilters(Comment.class, filters);
        return responseOkWithBody(list);
    }

    /**
     * Fetches all Comments by a specified user for a specified practitioner
     * @param id
     * @return
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("{practitionerId}/{userId}")
    public Response getByPractitionerAndUser(
    		@PathParam("practitionerId") Long practitionerId,
    		@PathParam("userId") Long userId){
    	
        DataAccess da = new DataAccess();
        DataAccess.Filter[] filters = new DataAccess.Filter[] {
        		new Filter("practitionerId ==", practitionerId),
        		new Filter("userId ==", userId)
        };
        List<Comment> list = da.getAllByFilters(Comment.class, filters);
        return responseOkWithBody(list);
    }
}
