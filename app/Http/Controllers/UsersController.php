<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserRequest;
use App\User;
use Illuminate\Http\Request;

use App\Http\Requests;

class UsersController extends DashboardController
{
    public function index()
    {
        $users = User::all();

        return view('dashboard.user.index', compact('users'));
    }

    public function create()
    {
        return view('dashboard.user.create');
    }

    public function store(UserRequest $request)
    {
        $user = User::createFromDashboard($request->all());

        $user->roles()->sync($request->input('roles') ?: []);

        return redirect()->route('all_users');
    }

    public function edit(User $user)
    {
        return view('dashboard.user.edit', compact('user'));
    }

    public function update(User $user, Request $request)
    {
        $user->updateFromDashboard($request->all());

        $user->roles()->sync($request->input('roles') ?: []);

        return redirect()->route('all_users');
    }
}
