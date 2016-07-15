<?php

namespace App\Http\Controllers;

use App\Document;
use App\Helpers\Session;
use App\Http\Requests\DocumentRequest;
use Illuminate\Http\Request;

use App\Http\Requests;

class DocumentsController extends DashboardController
{
    public function index()
    {
        $documents = Document::paginate(10);

        return view('dashboard.document.index', compact('documents'));
    }

    public function create()
    {
        return view('dashboard.document.create');
    }

    public function store(DocumentRequest $request)
    {
        session_start();

        Document::create($request->all());

        return redirect()->route('all_documents');
    }

    public function edit(Document $document)
    {
        return view('dashboard.document.edit', compact('document'));
    }

    public function update(DocumentRequest $request, Document $document)
    {
        $document->update($request->all());

        return redirect()->route('all_documents');
    }

    public function upload(Request $request)
    {
        session_start();
        $_SESSION['hash'] = get_hash($request->input('name') . time());
        $_SESSION['name'] = unique_name(public_path('documents'), $request->input('name'), true);
        $_SESSION['uploaddir'] = public_path('documents');
        die('1');
    }

    public function destroy(Document $document)
    {
        $document->delete();

        return redirect()->route('all_documents');
    }


}
