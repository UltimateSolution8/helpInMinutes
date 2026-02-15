package com.helpinminutes.identity.security;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.helpinminutes.identity.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPrincipal implements UserDetails {

    private UUID id;
    private String email;
    private String name;
    private String role;
    
    @JsonIgnore
    private String password;
    
    private Boolean isActive;
    private Boolean isEmailVerified;
    private Boolean isPhoneVerified;

    public static UserPrincipal create(User user) {
        return UserPrincipal.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().name())
                .password(user.getPasswordHash())
                .isActive(user.getIsActive())
                .isEmailVerified(user.getIsEmailVerified())
                .isPhoneVerified(user.getIsPhoneVerified())
                .build();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return isActive;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return isActive;
    }

    public boolean isVerified() {
        return isEmailVerified || isPhoneVerified;
    }
}
