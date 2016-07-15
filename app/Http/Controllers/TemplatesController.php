<?php

namespace App\Http\Controllers;

use App\Http\Requests\TemplateRequest;
use App\Template;
use Illuminate\Http\Request;

use App\Http\Requests;

class TemplatesController extends DashboardController
{
    public function index()
    {
        $templates = Template::all();

        return view('dashboard.templates.index', compact('templates'));
    }
    public function create()
    {
        $files = Template::getFileNames();

        return view('dashboard.templates.create', compact('files'));
    }

    public function store(TemplateRequest $request)
    {
        Template::create($request->all());

        return redirect()->route('all_pages');
    }
}
