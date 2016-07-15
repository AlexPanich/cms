<?php

namespace App\Http\Controllers;

use App\Http\Requests;
use Gate;

class DashboardController extends Controller
{
    public function __construct()
    {
        $this->middleware('dashboard');
    }

    public function index()
    {
        return view('dashboard.index');
    }
}
