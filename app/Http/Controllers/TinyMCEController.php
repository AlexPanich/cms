<?php

namespace App\Http\Controllers;

use App\Gallery;
use Illuminate\Http\Request;

use App\Http\Requests;

class TinyMCEController extends DashboardController
{
    public function gallery()
    {
        return Gallery::all();
    }
}
