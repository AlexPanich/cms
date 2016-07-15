<?php

namespace App\Http\Controllers;

use App\Http\Requests\RoleRequest;
use App\Role;
use Illuminate\Http\Request;

use App\Http\Requests;

class RolesController extends DashboardController
{
    public function index()
    {
        $roles = Role::all();

        return view('dashboard.role.index', compact('roles'));
    }

    public function create()
    {
        return view('dashboard.role.create');
    }

    public function store(RoleRequest $request)
    {
        $role = Role::create($request->all());

        $role->permissions()->sync($request->input('permissions') ?: []);

        return redirect()->route('all_roles');
    }

    public function edit(Role $role)
    {
        return view('dashboard.role.edit', compact('role'));
    }

    public function update(Role $role, RoleRequest $request)
    {
        $role->update($request->all());

        $role->permissions()->sync($request->input('permission') ?: []);

        return redirect()->route('all_roles');
    }
}
