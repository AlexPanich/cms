<?php

namespace App\Http\Controllers;

use App\Http\Requests\TextRequest;
use App\Text;
use Illuminate\Http\Request;

use App\Http\Requests;

class TextsController extends DashboardController
{
    public function index()
    {
        $texts = Text::paginate(10);

        return view('dashboard.text.index', compact('texts'));
    }

    public function create()
    {
        return view('dashboard.text.create');
    }

    public function store(TextRequest $request)
    {
        Text::create($request->all());

        return redirect()->route('all_texts');
    }

    public function edit(Text $text)
    {
        return view('dashboard.text.edit', compact('text'));
    }

    public function update(TextRequest $request, Text $text)
    {
        $text->update($request->all());

        return redirect()->route('all_texts');
    }
}
