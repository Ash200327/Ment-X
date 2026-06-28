package com.mentx.repository;

import com.mentx.model.Group;
import com.mentx.model.GroupMember;
import com.mentx.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {
    @Query("SELECT gm FROM GroupMember gm JOIN FETCH gm.mentee WHERE gm.group = :group")
    List<GroupMember> findByGroup(@Param("group") Group group);

    @Query("SELECT gm FROM GroupMember gm JOIN FETCH gm.group g JOIN FETCH g.mentor WHERE gm.mentee = :mentee")
    List<GroupMember> findByMentee(@Param("mentee") User mentee);

    Optional<GroupMember> findByGroupAndMentee(Group group, User mentee);
    boolean existsByGroupAndMentee(Group group, User mentee);
    void deleteByGroupAndMentee(Group group, User mentee);
    void deleteByGroup(Group group);
}
