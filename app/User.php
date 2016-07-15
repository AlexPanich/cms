<?php

namespace App;

use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name', 'email', 'password',
    ];

    /**
     * The attributes that should be hidden for arrays.
     *
     * @var array
     */
    protected $hidden = [
        'password', 'remember_token',
    ];

    public function owns($relation)
    {
        return $relation->user_id == $this->id;
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class);
    }

    public function hasRole($role)
    {
        if (is_string($role)) {
            return $this->roles->contains('name', $role);
        }

        return (bool)$role->intersect($this->roles)->count();
    }

    public function getRolesAsString()
    {
        return $this->roles->map(function($elem) {
            return $elem->label;
        })->implode(', ');
    }

    public function assignRole($role)
    {
        return $this->roles()->save(
            Role::whereName($role)->firstOrFail()
        );
    }

    public static function create(array $attributes = [])
    {
        $user = parent::create($attributes);

        $user->assignRole('user');

        return $user;
    }

    public static function createFromDashboard(array $attributes = [])
    {
        $attributes['password'] = bcrypt($attributes['password']);

        return parent::create($attributes);
    }

    public function updateFromDashboard(array $attributes = [])
    {

        if ($attributes['password'] == '') {
            unset($attributes['password']);
        } else {
            $attributes['password'] = bcrypt($attributes['password']);
        }

        return parent::update($attributes);
    }
}
