package ca.bc.mefm.data;

import java.util.Date;

import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Id;
import com.googlecode.objectify.annotation.Index;

import lombok.AllArgsConstructor;
import lombok.Data;

@Entity
@Data
@AllArgsConstructor
public class User {
	public enum Status {ENABLED, SUSPENDED};
	
	@Id
	private Long	id;
	@Index
	private String 	username;
	private String 	password;
	private String 	email;
	private Integer	roleId;
	private Date	created;
	private Status	status;
	
	public User() {}
	
	/** Clears the password TODO Review in security implementation */
	public User withoutPassword () {
		password = null;
		return this;
	}
}
