package com.mentx.repository;

import com.mentx.model.Remark;
import com.mentx.model.WeeklyUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RemarkRepository extends JpaRepository<Remark, Long> {
    Optional<Remark> findByUpdate(WeeklyUpdate update);
    List<Remark> findByUpdateIn(List<WeeklyUpdate> updates);
}
