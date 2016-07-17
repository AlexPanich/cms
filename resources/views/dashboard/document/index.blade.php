@extends('layouts.dashboard')

@section('page_title')
    Документы
@endsection

@section('content_title')
    Все документы
@endsection()

@section('content')
    <?php $i = ($documents->currentPage() - 1) * 10 + 1?>
    <table class="table">
        <thead>
            <th>№</th>
            <th>Заголовок</th>
            <th>Посмотреть</th>
            <th>Действия</th>
        </thead>
        <tbody>
            @foreach($documents as $document)
                <tr>
                    <td>{{ $i++ }}</td>
                    <td>{{ $document->title }}</td>
                    <td><a href="{{ asset('documents/' . $document->path) }}" target="_blank">Просмотр (в новой вкладке)</a></td>
                    <td>
                        <a class="btn btn-default btn-sm" href="{{ route('edit_document', $document->id) }}">Редактировать</a>
                        <a class="btn btn-danger btn-sm" href="{{ route('delete_document', $document->id) }}">Удалить</a>
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>
    {{ $documents->render() }}
    <br>
    <p><a class="btn btn-primary btn-square" href="{{ route('create_document') }}">Создать новый</a></p>
@endsection